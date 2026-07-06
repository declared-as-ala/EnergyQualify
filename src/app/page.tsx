"use client";

import Link from "next/link";
import {
  Users,
  PhoneCall,
  MessageCircleHeart,
  FolderCheck,
  TrendingUp,
  CalendarClock,
  Radio,
  ArrowRight,
  Megaphone,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/common/page-header";
import { KpiCard } from "@/components/common/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { CampaignPerformanceChart } from "@/components/dashboard/campaign-performance-chart";
import { QualificationDonut, QUALIFICATION_DISTRIBUTION_COLORS } from "@/components/dashboard/qualification-donut";
import { ContactStatusBadge } from "@/components/common/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { fullName, formatDateTime, formatRelative, initials } from "@/lib/format";
import {
  computeFunnel,
  qualificationRate,
  campaignProgress,
  getContactsForCampaign,
  upcomingCallbacks,
  contactById,
  campaignById,
} from "@/lib/selectors";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const contacts = useAppStore((s) => s.contacts);
  const campaigns = useAppStore((s) => s.campaigns);
  const dossiers = useAppStore((s) => s.dossiers);
  const callbacks = useAppStore((s) => s.callbacks);
  const now = useAppStore((s) => s.now);

  if (campaigns.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader title="Vue d'ensemble" description="Suivez la performance de vos campagnes de pré-qualification." />
        <EmptyState
          icon={Megaphone}
          title="Aucun pilote pour le moment"
          description="Importez une liste de contacts puis créez votre première campagne pour voir apparaître vos statistiques ici."
          action={
            <Button render={<Link href="/import" />}>Importer une liste</Button>
          }
        />
      </motion.div>
    );
  }

  const funnel = computeFunnel(contacts);
  const qRate = qualificationRate(contacts);
  const totalCalled = funnel.called;
  const totalAnswered = funnel.answered;
  const totalInterested = funnel.interested;
  const totalQualified = funnel.qualified;

  const campaignPerf = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    qualificationRate: qualificationRate(getContactsForCampaign(contacts, c.id)),
  }));

  const distributionCounts = {
    pas_interesse: contacts.filter((c) => c.status === "NOT_INTERESTED").length,
    incomplet: contacts.filter((c) => c.status === "INTERESTED_INCOMPLETE_DOSSIER").length,
    qualifie: contacts.filter((c) => c.status === "QUALIFIED_DOSSIER").length,
    disqualifie_social: contacts.filter((c) => c.status === "DISQUALIFIED_SOCIAL_TARIFF").length,
    disqualifie_bruxelles: contacts.filter((c) => c.status === "DISQUALIFIED_BRUSSELS").length,
    rappel: contacts.filter((c) => c.status === "CALLBACK_REQUESTED").length,
    autres: contacts.filter((c) => c.status === "NO_ANSWER" || c.status === "FAILED_CALL").length,
  };
  const donutLabels: Record<string, string> = {
    pas_interesse: "Pas intéressé",
    incomplet: "Intéressé – incomplet",
    qualifie: "Dossier qualifié",
    disqualifie_social: "Disqualifié – tarif social",
    disqualifie_bruxelles: "Disqualifié – Bruxelles",
    rappel: "Rappel demandé",
    autres: "Sans réponse / échec",
  };
  const donutSlices = Object.entries(distributionCounts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      key,
      label: donutLabels[key],
      value,
      color: QUALIFICATION_DISTRIBUTION_COLORS[key],
    }));

  const pilot = campaignById(campaigns, "camp-voltia") ?? campaigns[campaigns.length - 1];
  const pilotContacts = getContactsForCampaign(contacts, pilot.id);
  const pilotFunnel = computeFunnel(pilotContacts);

  const liveContacts = contacts.filter((c) => c.status === "CALLING");
  const nextCallbacks = upcomingCallbacks(callbacks, now, 5);
  const recentDossiersList = [...dossiers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <PageHeader
        title="Vue d'ensemble"
        description="Suivez la performance de vos campagnes de pré-qualification IA en un coup d'œil."
        action={
          <Button render={<Link href="/campagnes/nouveau" />}>
            Nouvelle campagne <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard label="Contacts au pilote" value={funnel.imported} icon={Users} hint="tous pilotes actifs" />
        <KpiCard label="Appels tentés" value={totalCalled} icon={PhoneCall} hint={`${Math.round((totalCalled / Math.max(funnel.imported, 1)) * 100)}% du pilote`} />
        <KpiCard label="Réponses obtenues" value={totalAnswered} icon={Radio} tone="default" hint={`${totalCalled > 0 ? Math.round((totalAnswered / totalCalled) * 100) : 0}% des appels`} />
        <KpiCard label="Intéressés" value={totalInterested} icon={MessageCircleHeart} tone="warning" hint={`${totalAnswered > 0 ? Math.round((totalInterested / totalAnswered) * 100) : 0}% des réponses`} />
        <KpiCard label="Dossiers qualifiés" value={totalQualified} icon={FolderCheck} tone="success" hint="prêts pour le closer" />
        <KpiCard label="Taux de qualification" value={`${qRate}%`} icon={TrendingUp} tone="success" trend={{ value: 4.2 }} hint="vs. période précédente" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="xl:col-span-2 border-border/40 bg-card/60 backdrop-blur-xs shadow-xs hover:border-border/70 transition-all duration-300">
          <CardHeader>
            <CardTitle>Entonnoir de conversion</CardTitle>
            <CardDescription>Importés → Appelés → Répondu → Intéressés → Qualifiés</CardDescription>
          </CardHeader>
          <CardContent>
            <FunnelChart
              stages={[
                { label: "Importés", value: funnel.imported },
                { label: "Appelés", value: funnel.called },
                { label: "Ont répondu", value: funnel.answered },
                { label: "Intéressés", value: funnel.interested },
                { label: "Qualifiés", value: funnel.qualified },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs hover:border-border/70 transition-all duration-300">
          <CardHeader>
            <CardTitle>Répartition des issues</CardTitle>
            <CardDescription>Sur l&apos;ensemble des contacts appelés</CardDescription>
          </CardHeader>
          <CardContent>
            {donutSlices.length > 0 ? (
              <QualificationDonut slices={donutSlices} />
            ) : (
              <p className="text-sm text-muted-foreground">Pas encore d&apos;appels enregistrés.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="xl:col-span-2 border-border/40 bg-card/60 backdrop-blur-xs shadow-xs hover:border-border/70 transition-all duration-300">
          <CardHeader>
            <CardTitle>Performance par campagne</CardTitle>
            <CardDescription>Taux de qualification (dossiers qualifiés / appels tentés)</CardDescription>
          </CardHeader>
          <CardContent>
            <CampaignPerformanceChart data={campaignPerf} />
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs hover:border-border/70 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>État du pilote</CardTitle>
              <CardDescription>{pilot.name}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Échantillon sélectionné</span>
                <span className="font-medium tabular-nums">{pilot.pilotSize}</span>
              </div>
              <Progress value={campaignProgress(pilot, contacts)} />
            </div>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Appelés</dt>
              <dd className="text-right font-medium tabular-nums">{pilotFunnel.called}</dd>
              <dt className="text-muted-foreground">Réponses</dt>
              <dd className="text-right font-medium tabular-nums">{pilotFunnel.answered}</dd>
              <dt className="text-muted-foreground">Intéressés</dt>
              <dd className="text-right font-medium tabular-nums">{pilotFunnel.interested}</dd>
              <dt className="text-muted-foreground">Dossiers qualifiés</dt>
              <dd className="text-right font-medium tabular-nums text-emerald-600">{pilotFunnel.qualified}</dd>
            </dl>
            <Button variant="outline" size="sm" className="w-full" render={<Link href={`/campagnes/${pilot.id}`} />}>
              Voir la campagne
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="xl:col-span-2 border-border/40 bg-card/60 backdrop-blur-xs shadow-xs hover:border-border/70 transition-all duration-300">
          <CardHeader>
            <CardTitle>Dossiers qualifiés récents</CardTitle>
            <CardDescription>Les derniers dossiers transmis pour closing</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDossiersList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun dossier qualifié pour le moment.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Complétude</TableHead>
                    <TableHead>Créé</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDossiersList.map((d) => {
                    const contact = contactById(contacts, d.contactId);
                    if (!contact) return null;
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px]">{initials(contact.firstName, contact.lastName)}</AvatarFallback>
                          </Avatar>
                          {fullName(contact)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{contact.city}</TableCell>
                        <TableCell>{d.completenessPercent}%</TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(d.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" render={<Link href={`/dossiers/${d.id}`} />}>
                            Ouvrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs hover:border-border/70 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Activité en direct
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {liveContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun appel en cours actuellement.</p>
              ) : (
                liveContacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span>{fullName(c)}</span>
                    <ContactStatusBadge status={c.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs hover:border-border/70 transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4" /> Prochains rappels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {nextCallbacks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun rappel programmé.</p>
              ) : (
                nextCallbacks.map((cb) => {
                  const contact = contactById(contacts, cb.contactId);
                  if (!contact) return null;
                  return (
                    <div key={cb.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{fullName(contact)}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatRelative(cb.scheduledAt, now)}</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
