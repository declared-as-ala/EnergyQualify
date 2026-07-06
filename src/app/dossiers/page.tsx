"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutGrid,
  List,
  User,
  ArrowRight,
  ClipboardCheck,
  Building,
  UserCheck
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DossierStatusBadge } from "@/components/common/status-badge";
import { DOSSIER_PIPELINE_ORDER } from "@/lib/status";
import { fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DossierStatus, QualifiedDossier } from "@/lib/types";

const STATUS_LABELS: Record<DossierStatus, string> = {
  NOUVEAU_DOSSIER: "Nouveau",
  A_VERIFIER: "À vérifier",
  A_RAPPELER: "À rappeler",
  PRET_POUR_CLOSING: "Prêt pour closing",
  CONTRAT_ENVOYE: "Contrat envoyé",
  SIGNE: "Signé",
  PERDU: "Perdu",
};

export default function DossiersPage() {
  const router = useRouter();
  const dossiers = useAppStore((s) => s.dossiers);
  const contacts = useAppStore((s) => s.contacts);
  const users = useAppStore((s) => s.users);
  const setDossierStatus = useAppStore((s) => s.setDossierStatus);

  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Lookup helpers
  const getContact = (contactId: string) => contacts.find((c) => c.id === contactId);
  const getCloserName = (closerId?: string) => users.find((u) => u.id === closerId)?.name || "Non assigné";

  // Group dossiers by status
  const groupedDossiers = useMemo(() => {
    const groups: Record<DossierStatus, QualifiedDossier[]> = {
      NOUVEAU_DOSSIER: [],
      A_VERIFIER: [],
      A_RAPPELER: [],
      PRET_POUR_CLOSING: [],
      CONTRAT_ENVOYE: [],
      SIGNE: [],
      PERDU: [],
    };
    dossiers.forEach((d) => {
      if (groups[d.status]) groups[d.status].push(d);
    });
    return groups;
  }, [dossiers]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossiers qualifiés"
        description="Gérez le pipeline de closing des opportunités d'énergie qualifiées par l'assistant IA."
        action={
          <div className="flex gap-1.5 bg-muted p-0.5 rounded-lg border border-border/50 shrink-0">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="xs"
              className="px-2"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Kanban
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="xs"
              className="px-2"
              onClick={() => setViewMode("table")}
            >
              <List className="h-3.5 w-3.5 mr-1" /> Tableau
            </Button>
          </div>
        }
      />

      {/* Kanban Board View */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[60vh] -mx-4 px-4 lg:mx-0 lg:px-0">
          {DOSSIER_PIPELINE_ORDER.map((status) => {
            const columnDossiers = groupedDossiers[status] || [];
            return (
              <div key={status} className="w-72 shrink-0 bg-muted/30 border border-border/40 rounded-xl p-3 space-y-3">
                {/* Column Header */}
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-black text-xs uppercase tracking-wider text-foreground/80">
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="h-5 w-5 flex items-center justify-center rounded-full bg-background border text-[10px] font-mono font-bold text-muted-foreground">
                      {columnDossiers.length}
                    </span>
                  </div>
                </div>

                {/* Cards stack */}
                <div className="space-y-2.5 overflow-y-auto max-h-[65vh] pr-0.5">
                  {columnDossiers.map((d) => {
                    const c = getContact(d.contactId);
                    if (!c) return null;
                    return (
                      <Card
                        key={d.id}
                        className="border-border/40 bg-card hover:border-border/70 hover:shadow-xs transition-all duration-200"
                      >
                        <CardHeader className="p-3 pb-2 space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <span
                              className="font-heading font-bold text-xs text-foreground hover:underline cursor-pointer truncate"
                              onClick={() => router.push(`/dossiers/${d.id}`)}
                            >
                              {fullName(c)}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground shrink-0">{c.city}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-3">
                          {/* Completeness percent */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                              <span>Complétude</span>
                              <span>{d.completenessPercent}%</span>
                            </div>
                            <Progress value={d.completenessPercent} className="h-1" />
                          </div>

                          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                            <UserCheck className="h-3 w-3" />
                            <span className="truncate">Closer : {getCloserName(d.assignedCloserId)}</span>
                          </div>

                          {/* Quick inline pipeline transfer selector */}
                          <div className="pt-2 border-t border-border/30 flex justify-between items-center gap-1.5">
                            <Select
                              value={d.status}
                              onValueChange={(val) => setDossierStatus(d.id, val as DossierStatus)}
                            >
                              <SelectTrigger className="h-7 text-[10px] py-0 px-2 font-heading font-black tracking-wide uppercase border-border/40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DOSSIER_PIPELINE_ORDER.map((s) => (
                                  <SelectItem key={s} value={s} className="text-[10px] font-heading font-bold uppercase">
                                    {STATUS_LABELS[s]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="xs"
                              variant="ghost"
                              className="h-7 text-primary p-1 rounded"
                              render={<Link href={`/dossiers/${d.id}`} />}
                              nativeButton={false}
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flat List View */}
      {viewMode === "table" && (
        <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
          <CardContent className="p-0">
            {dossiers.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">Aucun dossier qualifié</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      <th className="p-3 font-heading font-black uppercase text-muted-foreground">Prospect</th>
                      <th className="p-3 font-heading font-black uppercase text-muted-foreground">Ville</th>
                      <th className="p-3 font-heading font-black uppercase text-muted-foreground">Closer</th>
                      <th className="p-3 font-heading font-black uppercase text-muted-foreground">Complétude</th>
                      <th className="p-3 font-heading font-black uppercase text-muted-foreground">Statut</th>
                      <th className="p-3 font-heading font-black uppercase text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {dossiers.map((d) => {
                      const c = getContact(d.contactId);
                      if (!c) return null;
                      return (
                        <tr
                          key={d.id}
                          className="hover:bg-muted/40 cursor-pointer"
                          onClick={() => router.push(`/dossiers/${d.id}`)}
                        >
                          <td className="p-3 font-heading font-bold text-foreground">
                            {fullName(c)}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {c.city} ({c.postalCode})
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {getCloserName(d.assignedCloserId)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 max-w-[100px]">
                              <Progress value={d.completenessPercent} className="h-1" />
                              <span className="font-mono text-[10px] text-muted-foreground shrink-0">{d.completenessPercent}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <DossierStatusBadge status={d.status} />
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="xs"
                              variant="ghost"
                              className="text-primary font-heading font-bold"
                              render={<Link href={`/dossiers/${d.id}`} />}
                              nativeButton={false}
                            >
                              Gérer
                            </Button>
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
      )}
    </div>
  );
}
