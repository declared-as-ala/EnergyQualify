"use client";

import { useMemo, useState } from "react";
import {
  ShieldAlert,
  FileCheck,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserX,
  Search,
  Check
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDateTime, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ComplianceCenterPage() {
  const doNotContact = useAppStore((s) => s.doNotContact);
  const contacts = useAppStore((s) => s.contacts);
  const auditLog = useAppStore((s) => s.auditLog);

  const [activeTab, setActiveTab] = useState("dnc");
  const [dncSearch, setDncSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // DNC lookup contacts list
  const dncList = useMemo(() => {
    return doNotContact
      .map((dnc) => {
        const c = contacts.find((contact) => contact.id === dnc.contactId);
        return {
          ...dnc,
          contactName: c ? fullName(c) : "Contact inconnu",
          phone: c ? c.phone : "—",
        };
      })
      .filter((item) => {
        return (
          item.contactName.toLowerCase().includes(dncSearch.toLowerCase()) ||
          item.phone.includes(dncSearch) ||
          item.reason.toLowerCase().includes(dncSearch.toLowerCase())
        );
      });
  }, [doNotContact, contacts, dncSearch]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLog.filter((log) => {
      return (
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.entityType.toLowerCase().includes(auditSearch.toLowerCase())
      );
    });
  }, [auditLog, auditSearch]);

  // Mock consent records
  const consentList = useMemo(() => {
    // Generate some consent records from qualified contacts
    return contacts
      .filter((c) => ["QUALIFIED_DOSSIER", "INTERESTED_INCOMPLETE_DOSSIER"].includes(c.status))
      .slice(0, 10)
      .map((c) => ({
        id: `consent-${c.id}`,
        contactName: fullName(c),
        phone: c.phone,
        consentGiven: true,
        consentText: "L'interlocuteur a consenti explicitement à une comparaison tarifaire et à la transmission de ses informations à un closer.",
        channel: "ASSISTANT_VOCAL",
        collectedAt: c.lastActivityAt || c.createdAt,
      }));
  }, [contacts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centre de conformité"
        description="Supervisez les consentements, l'exclusion réglementaire (DNC) et suivez les traces d'audit de sécurité."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="border-b border-border/40 pb-px mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="dnc" className="font-heading font-bold text-xs">Exclusions (Ne pas contacter)</TabsTrigger>
          <TabsTrigger value="consent" className="font-heading font-bold text-xs">Consentements recueillis</TabsTrigger>
          <TabsTrigger value="audit" className="font-heading font-bold text-xs">Piste d&apos;audit</TabsTrigger>
          <TabsTrigger value="windows" className="font-heading font-bold text-xs">Créneaux d&apos;appels</TabsTrigger>
        </TabsList>

        {/* Tab 1: Do Not Contact List */}
        <TabsContent value="dnc" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un numéro exclu..."
                value={dncSearch}
                onChange={(e) => setDncSearch(e.target.value)}
                className="pl-9 text-xs rounded-lg"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold">
              {dncList.length} numéros exclus du pilote.
            </p>
          </div>

          <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
            <CardContent className="p-0">
              {dncList.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">Aucune exclusion répertoriée</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Contact</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Numéro</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Motif d&apos;exclusion</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Date d&apos;ajout</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Agent Closer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {dncList.map((d) => (
                        <tr key={d.id}>
                          <td className="p-3 font-heading font-bold text-foreground">{d.contactName}</td>
                          <td className="p-3 font-mono text-muted-foreground">{d.phone}</td>
                          <td className="p-3 text-foreground/80 leading-normal">{d.reason}</td>
                          <td className="p-3 text-muted-foreground">{formatDateTime(d.createdAt)}</td>
                          <td className="p-3 text-muted-foreground">{d.createdBy || "Système"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Consent records */}
        <TabsContent value="consent" className="space-y-4">
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
            <CardContent className="p-0">
              {consentList.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">Aucun consentement enregistré</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Contact</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Numéro</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Déclaration de consentement</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Canal</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Date / Heure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {consentList.map((c) => (
                        <tr key={c.id}>
                          <td className="p-3 font-heading font-bold text-foreground">{c.contactName}</td>
                          <td className="p-3 font-mono text-muted-foreground">{c.phone}</td>
                          <td className="p-3 text-foreground/85 leading-normal max-w-sm">{c.consentText}</td>
                          <td className="p-3">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-heading font-black text-[9px] uppercase tracking-wider">
                              {c.channel}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{formatDateTime(c.collectedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Audit trail */}
        <TabsContent value="audit" className="space-y-4">
          <div className="flex justify-between items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un événement d'audit..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="pl-9 text-xs rounded-lg"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold">
              {filteredAuditLogs.length} événements enregistrés.
            </p>
          </div>

          <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
            <CardContent className="p-0">
              {filteredAuditLogs.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">Aucune trace d&apos;audit trouvée</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Date / Heure</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Action</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Entité</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Utilisateur</th>
                        <th className="p-3 font-heading font-black uppercase text-muted-foreground">Détails</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredAuditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="p-3 text-muted-foreground">{formatDateTime(log.createdAt)}</td>
                          <td className="p-3 font-heading font-bold text-foreground">{log.action}</td>
                          <td className="p-3 font-mono text-muted-foreground">{log.entityType}</td>
                          <td className="p-3 text-muted-foreground font-medium">{log.userName}</td>
                          <td className="p-3 text-muted-foreground truncate max-w-xs">
                            {log.metadata ? JSON.stringify(log.metadata) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Calling windows */}
        <TabsContent value="windows">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/40 bg-card/60 backdrop-blur-xs md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-heading font-bold">Plages d&apos;appels réglementaires</CardTitle>
                <CardDescription className="text-[10px]">
                  Limitez les appels téléphoniques automatiques aux heures légales du pilote en Belgique.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Heure limite matin</Label>
                    <Input defaultValue="09:00" type="time" className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Heure limite soir</Label>
                    <Input defaultValue="20:00" type="time" className="text-xs" />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Jours autorisés pour la prospection</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, idx) => (
                      <label
                        key={day}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-heading font-bold cursor-pointer hover:bg-muted transition-colors",
                          idx < 5
                            ? "bg-primary/5 border-primary/20 text-primary"
                            : "border-border text-muted-foreground/60"
                        )}
                      >
                        <input
                          type="checkbox"
                          defaultChecked={idx < 5}
                          className="hidden"
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex justify-end">
                  <Button size="xs" className="font-heading font-bold shadow-xs">
                    Enregistrer les créneaux
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Compliance warning card */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-orange-500" /> Réglementation Belge (IBPT)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs leading-normal text-muted-foreground space-y-2.5">
                <p>
                  En Belgique, la prospection téléphonique commerciale est soumise à des créneaux horaires réglementaires stricts.
                </p>
                <p className="font-medium text-foreground">
                  • Interdiction d&apos;appeler avant 09h00 et après 20h00 en semaine.
                </p>
                <p className="font-medium text-foreground">
                  • Interdiction absolue d&apos;appeler les dimanches et jours fériés légaux.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
