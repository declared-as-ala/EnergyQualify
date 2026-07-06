"use client";

import { useMemo, useState, use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Play,
  Pause,
  ArrowLeft,
  Users,
  Phone,
  Settings,
  ShieldCheck,
  Activity,
  FileText,
  HelpCircle,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FolderOpen
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { CampaignStatusBadge, CallStatusBadge, QualificationResultBadge } from "@/components/common/status-badge";
import { ContactDetailSheet } from "@/components/contacts/contact-detail-sheet";
import {
  campaignProgress,
  qualificationRate,
  answerRate,
  getContactsForCampaign,
  campaignById,
} from "@/lib/selectors";
import { formatDateTime, formatDuration, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CampaignChecklist, Call } from "@/lib/types";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const campaigns = useAppStore((s) => s.campaigns);
  const contacts = useAppStore((s) => s.contacts);
  const calls = useAppStore((s) => s.calls);
  const auditLog = useAppStore((s) => s.auditLog);
  const setCampaignStatus = useAppStore((s) => s.setCampaignStatus);
  const updateChecklist = useAppStore((s) => s.updateChecklist);

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const campaign = useMemo(() => campaignById(campaigns, id), [campaigns, id]);

  const campaignContacts = useMemo(() => {
    if (!campaign) return [];
    return getContactsForCampaign(contacts, campaign.id);
  }, [contacts, campaign]);

  const campaignCalls = useMemo(() => {
    if (!campaign) return [];
    return calls.filter((c) => c.campaignId === campaign.id);
  }, [calls, campaign]);

  const campaignLogs = useMemo(() => {
    if (!campaign) return [];
    return auditLog.filter((log) => log.entityId === campaign.id || log.metadata?.entityId === campaign.id);
  }, [auditLog, campaign]);

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-heading font-bold text-foreground">Campagne introuvable</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Cette campagne n&apos;existe pas ou a été supprimée.
        </p>
        <Button className="mt-4" render={<Link href="/campagnes" />} nativeButton={false}>
          Retour aux campagnes
        </Button>
      </div>
    );
  }

  const progress = campaignProgress(campaign, contacts);
  const qRate = qualificationRate(campaignContacts);
  const aRate = answerRate(campaignContacts);

  // Checklist labels in French
  const CHECKLIST_LABELS: Record<keyof CampaignChecklist, string> = {
    contactListReviewed: "Liste des contacts révisée et approuvée",
    doNotContactApplied: "Filtres d'exclusion de contacts (DNC) appliqués",
    callHoursConfigured: "Plage horaire réglementaire configurée",
    scriptReviewed: "Script de l'agent IA testé et validé",
    dataFieldsApproved: "Champs d'informations de dossier approuvés",
    pilotScopeConfirmed: "Périmètre de l'échantillon pilote confirmé",
  };

  const checklistItems = Object.keys(campaign.checklist) as (keyof CampaignChecklist)[];
  const approvedCount = checklistItems.filter((key) => campaign.checklist[key]).length;
  const isAllApproved = approvedCount === checklistItems.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/campagnes" />} className="rounded-full shrink-0" nativeButton={false}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-heading font-black tracking-tight text-foreground truncate">
              {campaign.name}
            </h2>
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{campaign.offer}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {campaign.status === "RUNNING" ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 font-heading font-bold"
              onClick={() => setCampaignStatus(campaign.id, "PAUSED")}
            >
              <Pause className="h-4 w-4" /> Suspendre
            </Button>
          ) : (
            campaign.status !== "COMPLETED" && (
              <Button
                size="sm"
                className="gap-1.5 font-heading font-bold"
                disabled={!isAllApproved}
                onClick={() => setCampaignStatus(campaign.id, "RUNNING")}
              >
                <Play className="h-4 w-4" /> Lancer la campagne
              </Button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Tabs Content */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList variant="line" className="border-b border-border/40 pb-px mb-4 w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview" className="font-heading font-bold text-xs">Vue d&apos;ensemble</TabsTrigger>
              <TabsTrigger value="contacts" className="font-heading font-bold text-xs">Contacts ({campaignContacts.length})</TabsTrigger>
              <TabsTrigger value="calls" className="font-heading font-bold text-xs">Appels ({campaignCalls.length})</TabsTrigger>
              <TabsTrigger value="script" className="font-heading font-bold text-xs">Script IA</TabsTrigger>
              <TabsTrigger value="rules" className="font-heading font-bold text-xs">Règles</TabsTrigger>
              <TabsTrigger value="activity" className="font-heading font-bold text-xs">Logs d&apos;activité</TabsTrigger>
            </TabsList>

            {/* Overview Panel */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border/30 bg-muted/5 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Avancement</p>
                  <p className="text-xl font-heading font-black text-foreground mt-1 tabular-nums">{progress}%</p>
                  <Progress value={progress} className="mt-2" />
                </Card>
                <Card className="border-border/30 bg-muted/5 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Appels Effectués</p>
                  <p className="text-xl font-heading font-black text-foreground mt-1 tabular-nums">{campaignCalls.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Sur {campaignContacts.length} assignés</p>
                </Card>
                <Card className="border-border/30 bg-muted/5 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Taux de Réponse</p>
                  <p className="text-xl font-heading font-black text-foreground mt-1 tabular-nums">{aRate}%</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Décrochés valides</p>
                </Card>
                <Card className="border-border/30 bg-muted/5 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Taux de Qualif.</p>
                  <p className="text-xl font-heading font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{qRate}%</p>
                  <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">Dossiers transmis</p>
                </Card>
              </div>

              {/* Campaign description */}
              <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-heading font-bold">À propos de la campagne</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed text-foreground/80">
                  <div>
                    <p className="font-semibold text-muted-foreground">Offre promotionnelle :</p>
                    <p className="text-foreground mt-0.5">{campaign.offer}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Segment Ciblé :</p>
                    <p className="text-foreground mt-0.5">{campaign.targetSegment}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="font-semibold text-muted-foreground">Fournisseur voix :</p>
                      <p className="text-foreground font-mono mt-0.5">{campaign.voiceProvider}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Heures de contact :</p>
                      <p className="text-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {campaign.callHoursStart} - {campaign.callHoursEnd}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent calls preview */}
              <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-heading font-bold">Appels récents</CardTitle>
                  <CardDescription className="text-[10px]">Derniers contacts appelés par l&apos;assistant IA.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {campaignCalls.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">Aucun appel passé</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/20">
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Contact</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Statut d&apos;appel</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Date</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground text-right">Durée</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {campaignCalls.slice(0, 5).map((call) => {
                            const c = contacts.find((contact) => contact.id === call.contactId);
                            return (
                              <tr
                                key={call.id}
                                className="hover:bg-muted/40 cursor-pointer"
                                onClick={() => router.push(`/appels/${call.id}`)}
                              >
                                <td className="p-3 font-medium text-foreground">
                                  {c ? fullName(c) : "Inconnu"}
                                </td>
                                <td className="p-3">
                                  <CallStatusBadge status={call.status} />
                                </td>
                                <td className="p-3 text-muted-foreground">
                                  {formatDateTime(call.startedAt)}
                                </td>
                                <td className="p-3 text-right font-mono text-muted-foreground">
                                  {call.durationSec ? formatDuration(call.durationSec) : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contacts list */}
            <TabsContent value="contacts">
              <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
                <CardContent className="p-0">
                  {campaignContacts.length === 0 ? (
                    <div className="text-center py-12 text-xs text-muted-foreground">Aucun contact assigné</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/20">
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Nom complet</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Ville</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Téléphone</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Intérêt</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {campaignContacts.map((c) => (
                            <tr
                              key={c.id}
                              className="hover:bg-muted/40 cursor-pointer"
                              onClick={() => {
                                setSelectedContactId(c.id);
                                setSheetOpen(true);
                              }}
                            >
                              <td className="p-3 font-heading font-bold text-foreground">
                                {fullName(c)}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {c.city} ({c.postalCode})
                              </td>
                              <td className="p-3 font-mono text-muted-foreground">
                                {c.phone}
                              </td>
                              <td className="p-3">
                                {c.interestLevel !== "INCONNU" ? (
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-heading font-black uppercase tracking-wider",
                                    c.interestLevel === "ELEVE" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                    c.interestLevel === "MOYEN" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                                    c.interestLevel === "FAIBLE" && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                                  )}>
                                    {c.interestLevel}
                                  </span>
                                ) : "—"}
                              </td>
                              <td className="p-3">
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded-full text-[10px] font-heading font-bold",
                                  c.status === "QUALIFIED_DOSSIER" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                  c.status === "CALLBACK_REQUESTED" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                                  c.status === "DO_NOT_CONTACT" && "bg-red-500/10 text-red-600 dark:text-red-400",
                                  c.status === "READY_TO_CALL" && "bg-muted text-muted-foreground",
                                  c.status === "CALLING" && "bg-emerald-500 text-white animate-pulse",
                                  !["QUALIFIED_DOSSIER", "CALLBACK_REQUESTED", "DO_NOT_CONTACT", "READY_TO_CALL", "CALLING"].includes(c.status) && "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                )}>
                                  {c.status}
                                </span>
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

            {/* Calls list */}
            <TabsContent value="calls">
              <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
                <CardContent className="p-0">
                  {campaignCalls.length === 0 ? (
                    <div className="text-center py-12 text-xs text-muted-foreground">Aucun appel enregistré</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/20">
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">ID</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Contact</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Statut</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Résultat qualification</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Confiance IA</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground text-right">Durée</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {campaignCalls.map((call) => {
                            const c = contacts.find((contact) => contact.id === call.contactId);
                            return (
                              <tr
                                key={call.id}
                                className="hover:bg-muted/40 cursor-pointer"
                                onClick={() => router.push(`/appels/${call.id}`)}
                              >
                                <td className="p-3 font-mono font-medium text-muted-foreground">
                                  {call.id}
                                </td>
                                <td className="p-3 font-heading font-bold text-foreground">
                                  {c ? fullName(c) : "Inconnu"}
                                </td>
                                <td className="p-3">
                                  <CallStatusBadge status={call.status} />
                                </td>
                                <td className="p-3">
                                  <QualificationResultBadge result={call.qualificationResult} />
                                </td>
                                <td className="p-3 font-mono tabular-nums text-muted-foreground">
                                  {call.aiConfidence ? `${Math.round(call.aiConfidence * 100)}%` : "—"}
                                </td>
                                <td className="p-3 text-right font-mono text-muted-foreground">
                                  {call.durationSec ? formatDuration(call.durationSec) : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agent script */}
            <TabsContent value="script" className="space-y-6">
              <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-heading font-bold">Script vocal de l&apos;assistant</CardTitle>
                  <CardDescription className="text-[10px]">
                    Message d&apos;ouverture et directives de traitement des objections de l&apos;assistant IA.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="font-heading font-bold text-muted-foreground">Message d&apos;introduction réglementaire :</p>
                    <div className="bg-muted/30 p-3 rounded-lg border border-border/30 italic text-foreground/90">
                      « Bonjour, je suis l&apos;assistant vocal automatisé de l&apos;équipe. Je vous appelle pour une comparaison tarif énergie pilote de 30 secondes. Cet appel est enregistré… »
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <p className="font-heading font-bold text-muted-foreground">Champs requis à collecter :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {campaign.rules.requiredFields.map((f) => (
                        <span key={f} className="px-2 py-1 bg-primary/5 text-primary border border-primary/10 rounded-md text-[10px] font-heading font-bold">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rules */}
            <TabsContent value="rules" className="space-y-6">
              <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-heading font-bold">Critères d&apos;admissibilité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-1 rounded-full", campaign.rules.excludeBrussels ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-heading font-bold">Exclusion Région de Bruxelles-Capitale</p>
                      <p className="text-[10px] text-muted-foreground">
                        Les résidents bruxellois (codes postaux 1000-1299) sont écartés du pilote.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t border-border/20 pt-3">
                    <div className={cn("p-1 rounded-full", campaign.rules.excludeSocialTariff ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-heading font-bold">Exclusion Tarif Social</p>
                      <p className="text-[10px] text-muted-foreground">
                        Les bénéficiaires du tarif social énergétique ne sont pas admissibles.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t border-border/20 pt-3">
                    <div className={cn("p-1 rounded-full", campaign.rules.requireInterest ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-heading font-bold">Consentement requis</p>
                      <p className="text-[10px] text-muted-foreground">
                        Le prospect doit explicitement accepter une comparaison de tarifs énergétiques.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs */}
            <TabsContent value="activity">
              <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
                <CardContent className="p-0">
                  {campaignLogs.length === 0 ? (
                    <div className="text-center py-12 text-xs text-muted-foreground">Aucune activité enregistrée</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-border/40 bg-muted/20">
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Date</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Action</th>
                            <th className="p-3 font-heading font-black uppercase text-muted-foreground">Utilisateur</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {campaignLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="p-3 text-muted-foreground">
                                {formatDateTime(log.createdAt)}
                              </td>
                              <td className="p-3 font-heading font-bold text-foreground">
                                {log.action}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {log.userName}
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
          </Tabs>
        </div>

        {/* Right Column: Compliance Sidebar Checklist */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs sticky top-20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-xs font-heading font-black uppercase tracking-wider">
                  Checklist Conformité
                </CardTitle>
              </div>
              <CardDescription className="text-[10px] mt-0.5">
                Vérifications obligatoires à valider avant d&apos;activer la campagne.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {checklistItems.map((key) => (
                  <div key={key} className="flex items-start gap-2.5">
                    <Checkbox
                      checked={campaign.checklist[key]}
                      onCheckedChange={(checked) => {
                        updateChecklist(campaign.id, { [key]: Boolean(checked) });
                      }}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-xs font-heading font-semibold text-foreground/80 leading-normal">
                      {CHECKLIST_LABELS[key]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border/40">
                <div className="flex items-center justify-between text-xs font-heading font-bold text-foreground/90">
                  <span>Score d&apos;approbation</span>
                  <span>{approvedCount}/{checklistItems.length}</span>
                </div>
                <Progress value={(approvedCount / checklistItems.length) * 100} className="mt-2" />
                {isAllApproved ? (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Prête au lancement.
                  </p>
                ) : (
                  <p className="text-[10px] text-orange-500 font-semibold mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Approbation requise pour lancer.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Slide sheet for Contact Detail */}
      <ContactDetailSheet
        contactId={selectedContactId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
