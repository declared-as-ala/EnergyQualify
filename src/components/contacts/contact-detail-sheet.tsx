"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, CalendarPlus, FileText, PhoneCall, ShieldOff } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";
import { ContactStatusBadge } from "@/components/common/status-badge";
import { MaskedField } from "@/components/common/masked-field";
import { fullName, formatDateTime, formatDuration, initials, maskAddress, maskDateOfBirth, maskEan } from "@/lib/format";
import { campaignById } from "@/lib/selectors";

export function ContactDetailSheet({
  contactId,
  open,
  onOpenChange,
}: {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const contacts = useAppStore((s) => s.contacts);
  const calls = useAppStore((s) => s.calls);
  const campaigns = useAppStore((s) => s.campaigns);
  const dossiers = useAppStore((s) => s.dossiers);
  const markDoNotContact = useAppStore((s) => s.markDoNotContact);
  const scheduleCallback = useAppStore((s) => s.scheduleCallback);
  const updateContactNotes = useAppStore((s) => s.updateContactNotes);

  const contact = useMemo(() => contacts.find((c) => c.id === contactId), [contacts, contactId]);
  const contactCalls = useMemo(
    () => calls.filter((c) => c.contactId === contactId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [calls, contactId],
  );
  const dossier = useMemo(() => dossiers.find((d) => d.contactId === contactId), [dossiers, contactId]);
  const campaign = contact?.campaignId ? campaignById(campaigns, contact.campaignId) : undefined;

  const [notesDraft, setNotesDraft] = useState("");
  const [dncOpen, setDncOpen] = useState(false);
  const [dncReason, setDncReason] = useState("Demande explicite du contact.");
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackReason, setCallbackReason] = useState("");

  if (!contact) return null;

  const lastCall = contactCalls[0];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-primary/10 text-primary">{initials(contact.firstName, contact.lastName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <SheetTitle className="truncate">{fullName(contact)}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  {contact.city} · {contact.postalCode}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="px-4 pb-6 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <ContactStatusBadge status={contact.status} />
              {contact.isBrusselsGuess && (
                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                  Zone : Bruxelles
                </Badge>
              )}
              {campaign && (
                <Badge variant="outline">
                  <Link href={`/campagnes/${campaign.id}`}>{campaign.name}</Link>
                </Badge>
              )}
              {contact.score > 0 && (
                <Badge variant="outline" className="tabular-nums">
                  Score {contact.score}
                </Badge>
              )}
            </div>

            <section>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Profil</h4>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Téléphone</dt>
                <dd className="text-right tabular-nums">{contact.phone}</dd>
                <dt className="text-muted-foreground">Tranche d&apos;âge</dt>
                <dd className="text-right">{contact.ageRange ?? "—"}</dd>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="text-right truncate">{contact.email ?? "—"}</dd>
                <dt className="text-muted-foreground">Fournisseur actuel</dt>
                <dd className="text-right">{contact.supplier ?? "—"}</dd>
              </dl>
            </section>

            <Separator />

            <section>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Données sensibles</h4>
              <div className="rounded-lg border p-3 space-y-1 bg-muted/30">
                <MaskedField label="Adresse complète" value={contact.address} masked={maskAddress(contact.address)} />
                <MaskedField label="Date de naissance" value={contact.dateOfBirth ?? "—"} masked={maskDateOfBirth(contact.dateOfBirth)} />
                <MaskedField label="Code EAN" value={contact.eanCode ?? "—"} masked={maskEan(contact.eanCode)} />
              </div>
            </section>

            <Separator />

            <section>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Historique des appels</h4>
              {contactCalls.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun appel enregistré pour ce contact.</p>
              ) : (
                <ul className="space-y-2">
                  {contactCalls.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <PhoneCall className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{formatDateTime(c.startedAt)}</span>
                        <span className="text-muted-foreground shrink-0">{formatDuration(c.durationSec)}</span>
                      </div>
                      <Button variant="ghost" size="sm" render={<Link href={`/appels/${c.id}`} />}>
                        Détails
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {lastCall?.transcript && lastCall.transcript.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Aperçu du dernier échange</h4>
                <div className="rounded-lg border p-3 space-y-2 max-h-40 overflow-y-auto bg-muted/20">
                  {lastCall.transcript.slice(0, 4).map((t, i) => (
                    <p key={i} className="text-xs">
                      <span className={t.speaker === "agent" ? "font-medium text-primary" : "font-medium"}>
                        {t.speaker === "agent" ? "IA" : contact.firstName}:
                      </span>{" "}
                      {t.text}
                    </p>
                  ))}
                </div>
              </section>
            )}

            <Separator />

            <section>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Notes internes</h4>
              <Textarea
                placeholder="Ajouter une note interne…"
                defaultValue={contact.notes ?? ""}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    updateContactNotes(contact.id, notesDraft);
                    toast.success("Note enregistrée");
                  }}
                >
                  Enregistrer la note
                </Button>
              </div>
            </section>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setCallbackOpen(true)}>
                <CalendarPlus className="h-3.5 w-3.5" /> Planifier un rappel
              </Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDncOpen(true)}>
                <ShieldOff className="h-3.5 w-3.5" /> Ne pas contacter
              </Button>
              {dossier && (
                <Button size="sm" render={<Link href={`/dossiers/${dossier.id}`} />}>
                  <FileText className="h-3.5 w-3.5" /> Ouvrir le dossier complet
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={dncOpen} onOpenChange={setDncOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Marquer « Ne pas contacter »
            </DialogTitle>
            <DialogDescription>
              {fullName(contact)} ne sera plus jamais appelé(e), quelle que soit la campagne. Cette action est tracée dans le
              journal d&apos;audit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="dnc-reason">Motif</Label>
            <Input id="dnc-reason" value={dncReason} onChange={(e) => setDncReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDncOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                markDoNotContact([contact.id], dncReason);
                setDncOpen(false);
                toast.success(`${fullName(contact)} ajouté(e) à la liste Ne pas contacter`);
              }}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={callbackOpen} onOpenChange={setCallbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planifier un rappel</DialogTitle>
            <DialogDescription>Choisissez une date et une heure pour rappeler {fullName(contact)}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="cb-date">Date et heure</Label>
              <Input id="cb-date" type="datetime-local" value={callbackDate} onChange={(e) => setCallbackDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cb-reason">Raison</Label>
              <Input
                id="cb-reason"
                placeholder="Contact occupé, a demandé un rappel…"
                value={callbackReason}
                onChange={(e) => setCallbackReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCallbackOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={!callbackDate}
              onClick={() => {
                if (!contact.campaignId) return;
                scheduleCallback(contact.id, contact.campaignId, new Date(callbackDate).toISOString(), callbackReason);
                setCallbackOpen(false);
                toast.success("Rappel planifié");
              }}
            >
              Planifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
