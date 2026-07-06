"use client";

import Link from "next/link";
import { Plus, Play, Pause, AlertTriangle, ArrowRight, BarChart2, Users, FileText, CheckSquare, Settings } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CampaignStatusBadge } from "@/components/common/status-badge";
import {
  campaignProgress,
  qualificationRate,
  answerRate,
  getContactsForCampaign,
} from "@/lib/selectors";
import type { Campaign } from "@/lib/types";

export default function CampaignsPage() {
  const campaigns = useAppStore((s) => s.campaigns);
  const contacts = useAppStore((s) => s.contacts);
  const setCampaignStatus = useAppStore((s) => s.setCampaignStatus);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campagnes"
        description="Gérez vos campagnes de pré-qualification et suivez leur avancement en temps réel."
        action={
          <Button render={<Link href="/campagnes/nouveau" />} nativeButton={false}>
            <Plus className="h-4 w-4" /> Nouvelle campagne
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.map((c) => {
          const campContacts = getContactsForCampaign(contacts, c.id);
          const progress = campaignProgress(c, contacts);
          const qRate = qualificationRate(campContacts);
          const aRate = answerRate(campContacts);
          const totalAssigned = campContacts.length;

          // Check compliance score (how many items in checklist are true)
          const checklistItems = Object.values(c.checklist);
          const approvedCount = checklistItems.filter(Boolean).length;
          const isCompliant = approvedCount === checklistItems.length;

          return (
            <Card
              key={c.id}
              className="flex flex-col border-border/40 bg-card/60 backdrop-blur-xs shadow-xs hover:border-border/70 hover:shadow-sm transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-heading font-bold text-base leading-snug tracking-tight">
                      {c.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      {c.offer}
                    </CardDescription>
                  </div>
                  <CampaignStatusBadge status={c.status} />
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between pt-0 space-y-4">
                <div className="space-y-3">
                  {/* Segment Details */}
                  <p className="text-xs text-muted-foreground font-medium">
                    Segment : <span className="text-foreground">{c.targetSegment}</span>
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-heading font-semibold text-muted-foreground">
                      <span>Avancement</span>
                      <span className="font-mono tabular-nums">{progress}%</span>
                    </div>
                    <Progress value={progress} />
                    <p className="text-[10px] text-muted-foreground text-right">
                      {totalAssigned} contacts importés
                    </p>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                    <div className="bg-muted/10 p-2 rounded-lg border border-border/20">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Réponse</p>
                      <p className="text-sm font-mono font-bold text-foreground mt-0.5 tabular-nums">{aRate}%</p>
                    </div>
                    <div className="bg-muted/10 p-2 rounded-lg border border-border/20">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Qualification</p>
                      <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">{qRate}%</p>
                    </div>
                  </div>

                  {/* Compliance warning if not fully approved */}
                  {!isCompliant && c.status !== "COMPLETED" && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span className="font-medium">
                        Exigences de conformité : {approvedCount}/{checklistItems.length} approuvées
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border/40 gap-2">
                  <div className="flex gap-1.5">
                    {c.status === "RUNNING" ? (
                      <Button
                        size="xs"
                        variant="outline"
                        className="gap-1 font-heading font-semibold"
                        onClick={() => setCampaignStatus(c.id, "PAUSED")}
                      >
                        <Pause className="h-3 w-3" /> Mettre en pause
                      </Button>
                    ) : (
                      c.status !== "COMPLETED" && (
                        <Button
                          size="xs"
                          className="gap-1 font-heading font-semibold"
                          disabled={!isCompliant && c.status === "READY"} // Force checklist completion before running
                          onClick={() => setCampaignStatus(c.id, "RUNNING")}
                        >
                          <Play className="h-3 w-3" /> Lancer
                        </Button>
                      )
                    )}
                  </div>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="gap-1 text-primary font-heading font-semibold ml-auto"
                    render={<Link href={`/campagnes/${c.id}`} />}
                    nativeButton={false}
                  >
                    Détails <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
