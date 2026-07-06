"use client";

import { useMemo, useState, use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  User,
  ShieldCheck,
  Building,
  Calendar,
  Clock,
  ExternalLink,
  Edit2,
  Save,
  CheckCircle,
  FileText,
  Mail,
  Smartphone
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MaskedField } from "@/components/common/masked-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DossierStatusBadge } from "@/components/common/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { maskAddress, maskEan, maskDateOfBirth, formatDateTime, fullName } from "@/lib/format";
import { DOSSIER_PIPELINE_ORDER } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { DossierStatus } from "@/lib/types";

const STATUS_LABELS: Record<DossierStatus, string> = {
  NOUVEAU_DOSSIER: "Nouveau",
  A_VERIFIER: "À vérifier",
  A_RAPPELER: "À rappeler",
  PRET_POUR_CLOSING: "Prêt pour closing",
  CONTRAT_ENVOYE: "Contrat envoyé",
  SIGNE: "Signé",
  PERDU: "Perdu",
};

export default function DossierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const dossiers = useAppStore((s) => s.dossiers);
  const contacts = useAppStore((s) => s.contacts);
  const campaigns = useAppStore((s) => s.campaigns);
  const users = useAppStore((s) => s.users);
  const setDossierStatus = useAppStore((s) => s.setDossierStatus);
  const updateContactNotes = useAppStore((s) => s.updateContactNotes);
  const scheduleCallback = useAppStore((s) => s.scheduleCallback);

  const dossier = useMemo(() => dossiers.find((d) => d.id === id), [dossiers, id]);
  const contact = useMemo(() => (dossier ? contacts.find((c) => c.id === dossier.contactId) : undefined), [contacts, dossier]);
  const campaign = useMemo(() => (dossier ? campaigns.find((c) => c.id === dossier.campaignId) : undefined), [campaigns, dossier]);

  // Notes Local State
  const [notes, setNotes] = useState(contact?.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  // Callback Scheduling State
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTime, setCallbackTime] = useState("10:00");
  const [callbackReason, setCallbackReason] = useState("");

  const closers = useMemo(() => {
    return users.filter((u) => u.role === "CLOSER");
  }, [users]);

  if (!dossier || !contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <ShieldCheck className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-heading font-bold text-foreground">Dossier qualifié introuvable</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Ce dossier n&apos;existe pas ou a été supprimé.
        </p>
        <Button className="mt-4" render={<Link href="/dossiers" />} nativeButton={false}>
          Retour aux dossiers
        </Button>
      </div>
    );
  }

  const handleSaveNotes = () => {
    setSavingNotes(true);
    updateContactNotes(contact.id, notes);
    setTimeout(() => {
      setSavingNotes(false);
    }, 400);
  };

  const handleScheduleCallback = () => {
    if (!callbackDate) return;
    const isoDateTime = new Date(`${callbackDate}T${callbackTime}`).toISOString();
    scheduleCallback(contact.id, dossier.campaignId, isoDateTime, callbackReason);
    setDossierStatus(dossier.id, "A_RAPPELER", `Rappel planifié pour le ${callbackDate} à ${callbackTime}.`);
    setCallbackOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/dossiers" />} className="rounded-full shrink-0" nativeButton={false}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-heading font-black tracking-tight text-foreground truncate">
              Dossier · {fullName(contact)}
            </h2>
            <DossierStatusBadge status={dossier.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            Origine campagne : {campaign ? campaign.name : "Inconnu"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 font-heading font-bold"
            onClick={() => setCallbackOpen(true)}
          >
            <Calendar className="h-4 w-4" /> Planifier rappel
          </Button>

          {/* Quick status progress button overrides */}
          {dossier.status === "NOUVEAU_DOSSIER" && (
            <Button
              size="sm"
              className="gap-1.5 font-heading font-bold shadow-xs"
              onClick={() => setDossierStatus(dossier.id, "PRET_POUR_CLOSING", "Dossier validé pour closing par closer.")}
            >
              Prêt pour closing
            </Button>
          )}
          {dossier.status === "PRET_POUR_CLOSING" && (
            <Button
              size="sm"
              className="gap-1.5 font-heading font-bold shadow-xs"
              onClick={() => setDossierStatus(dossier.id, "CONTRAT_ENVOYE", "Contrat officiel envoyé par e-mail.")}
            >
              Envoyer contrat
            </Button>
          )}
          {dossier.status === "CONTRAT_ENVOYE" && (
            <Button
              size="sm"
              className="gap-1.5 font-heading font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setDossierStatus(dossier.id, "SIGNE", "Dossier clos d'un commun accord, contrat signé.")}
            >
              Marquer Signé
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal info & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info with reveal eye overlays */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading font-bold">Fiche prospect qualifiée</CardTitle>
              <CardDescription className="text-[10px]">
                Données d&apos;éligibilité vérifiées par l&apos;agent. Double-vérifiez avant closing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs divide-y divide-border/20">
              <div className="grid grid-cols-2 gap-4 py-2 first:pt-0">
                <div>
                  <p className="text-muted-foreground text-[10px]">Civilité / Nom complet</p>
                  <p className="font-heading font-bold text-sm mt-0.5">{contact.civility || ""} {fullName(contact)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">Téléphone</p>
                  <p className="font-mono mt-0.5 flex items-center gap-1">
                    <Smartphone className="h-3.5 w-3.5 text-muted-foreground" /> {contact.phone}
                  </p>
                </div>
              </div>

              <div className="py-2">
                <MaskedField
                  label="Adresse de raccordement"
                  value={contact.address}
                  masked={maskAddress(contact.address)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-muted-foreground text-[10px]">Code Postal / Ville</p>
                  <p className="font-semibold mt-0.5">{contact.postalCode} {contact.city}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">E-mail</p>
                  <p className="font-medium mt-0.5 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {contact.email || "—"}
                  </p>
                </div>
              </div>

              <div className="py-2">
                <MaskedField
                  label="Date de naissance"
                  value={contact.dateOfBirth || ""}
                  masked={maskDateOfBirth(contact.dateOfBirth)}
                />
              </div>

              <div className="py-2">
                <MaskedField
                  label="Code EAN (Belgique)"
                  value={contact.eanCode || ""}
                  masked={maskEan(contact.eanCode)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 last:pb-0">
                <div>
                  <p className="text-muted-foreground text-[10px]">Fournisseur actuel</p>
                  <p className="font-semibold mt-0.5">{contact.supplier || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px]">Tranche d&apos;âge</p>
                  <p className="font-semibold mt-0.5">{contact.ageRange || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Area */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading font-bold">Notes internes de closing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                rows={5}
                placeholder="Ajoutez des détails sur la relance, les objections formulées..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs"
              />
              <div className="flex justify-end">
                <Button size="xs" onClick={handleSaveNotes} disabled={savingNotes} className="font-heading font-bold shadow-xs">
                  {savingNotes ? "Enregistrement..." : "Enregistrer la note"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Close state selector & Timeline history */}
        <div className="space-y-6">
          {/* Set Status Card */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground">Modifier l&apos;étape</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Statut du closing</Label>
                <Select
                  value={dossier.status}
                  onValueChange={(val) => setDossierStatus(dossier.id, val as DossierStatus, "Modifié par closer.")}
                >
                  <SelectTrigger className="w-full font-heading text-xs font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOSSIER_PIPELINE_ORDER.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs font-heading font-semibold uppercase">
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 border-t border-border/30 text-xs">
                <span className="text-muted-foreground">Responsable closing : </span>
                <span className="font-semibold text-foreground">
                  {users.find((u) => u.id === dossier.assignedCloserId)?.name || "Non assigné"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Dossier status history timeline */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground">Historique du dossier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative pl-4 border-l border-border/60 space-y-4 text-xs">
                {dossier.statusHistory.map((h, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                    <div>
                      <p className="font-heading font-bold text-foreground/90">
                        {STATUS_LABELS[h.status]}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDateTime(h.at)}</p>
                      {h.note && (
                        <p className="text-[10px] text-muted-foreground italic mt-1 leading-normal bg-muted/20 p-1.5 border border-border/20 rounded">
                          {h.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Callback appointment booking Dialog */}
      <Dialog open={callbackOpen} onOpenChange={setCallbackOpen}>
        <DialogContent className="max-w-md w-full border-border/50 bg-card/95 backdrop-blur-md rounded-xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-heading font-black text-foreground">
              <Calendar className="h-4.5 w-4.5 text-primary" /> Planifier un rendez-vous closer
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              Déterminez la date et heure de relance téléphonique. Ce dossier basculera automatiquement sur « À rappeler ».
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={callbackTime}
                  onChange={(e) => setCallbackTime(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Motif du rappel</Label>
              <Input
                placeholder="Ex: Souhaite valider le prix de l'électricité avec son épouse"
                value={callbackReason}
                onChange={(e) => setCallbackReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <DialogClose render={<Button variant="outline" className="font-heading font-bold" />}>Annuler</DialogClose>
            <Button onClick={handleScheduleCallback} disabled={!callbackDate} className="font-heading font-bold shadow-xs">
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
