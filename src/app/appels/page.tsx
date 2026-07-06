"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, PhoneIncoming, Clock, ArrowRight, Activity, Calendar } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CallStatusBadge, QualificationResultBadge } from "@/components/common/status-badge";
import { formatDateTime, formatDuration, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CallHistoryPage() {
  const router = useRouter();
  const calls = useAppStore((s) => s.calls);
  const contacts = useAppStore((s) => s.contacts);
  const campaigns = useAppStore((s) => s.campaigns);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCalls = useMemo(() => {
    return calls
      .filter((call) => {
        const contact = contacts.find((c) => c.id === call.contactId);
        const nameMatch = contact
          ? fullName(contact).toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.phone.includes(searchQuery)
          : false;

        const campaignMatch = campaignFilter === "all" || call.campaignId === campaignFilter;
        const statusMatch = statusFilter === "all" || call.status === statusFilter || call.qualificationResult === statusFilter;

        return nameMatch && campaignMatch && statusMatch;
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [calls, contacts, searchQuery, campaignFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historique des appels"
        description="Consultez l'historique complet des tentatives d'appels et des transcriptions générées par l'agent IA."
      />

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou téléphone..."
            className="pl-9 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={campaignFilter} onValueChange={(val) => setCampaignFilter(val ?? "all")}>
          <SelectTrigger className="w-full md:w-56 font-heading text-xs font-bold">
            <SelectValue placeholder="Campagne" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les campagnes</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
          <SelectTrigger className="w-full md:w-56 font-heading text-xs font-bold">
            <SelectValue placeholder="Résultat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les résultats</SelectItem>
            <SelectItem value="QUALIFIED">Qualifié</SelectItem>
            <SelectItem value="INCOMPLETE_DOSSIER">Dossier Incomplet</SelectItem>
            <SelectItem value="CALLBACK_REQUESTED">Rappel Planifié</SelectItem>
            <SelectItem value="NOT_INTERESTED">Pas Intéressé</SelectItem>
            <SelectItem value="DISQUALIFIED_BRUSSELS">Exclus Bruxelles</SelectItem>
            <SelectItem value="DISQUALIFIED_SOCIAL_TARIFF">Exclus Tarif Social</SelectItem>
            <SelectItem value="NO_ANSWER">Pas de réponse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calls Log Table */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
        <CardContent className="p-0">
          {filteredCalls.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">Aucun appel trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="p-3 font-heading font-black uppercase text-muted-foreground">Contact</th>
                    <th className="p-3 font-heading font-black uppercase text-muted-foreground">Campagne</th>
                    <th className="p-3 font-heading font-black uppercase text-muted-foreground">Date / Heure</th>
                    <th className="p-3 font-heading font-black uppercase text-muted-foreground">Statut d&apos;appel</th>
                    <th className="p-3 font-heading font-black uppercase text-muted-foreground">Résultat</th>
                    <th className="p-3 font-heading font-black uppercase text-muted-foreground">Confiance IA</th>
                    <th className="p-3 font-heading font-black uppercase text-muted-foreground text-right">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredCalls.map((call) => {
                    const c = contacts.find((contact) => contact.id === call.contactId);
                    const camp = campaigns.find((campaign) => campaign.id === call.campaignId);
                    return (
                      <tr
                        key={call.id}
                        className="hover:bg-muted/40 cursor-pointer transition-colors"
                        onClick={() => router.push(`/appels/${call.id}`)}
                      >
                        <td className="p-3 font-heading font-bold text-foreground">
                          {c ? fullName(c) : "Inconnu"}
                        </td>
                        <td className="p-3 text-muted-foreground truncate max-w-[150px]">
                          {camp ? camp.name : "Inconnu"}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {formatDateTime(call.startedAt)}
                        </td>
                        <td className="p-3">
                          <CallStatusBadge status={call.status} />
                        </td>
                        <td className="p-3">
                          <QualificationResultBadge result={call.qualificationResult} />
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">
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
    </div>
  );
}

// Router helper wrapper (supports useRouter next/navigation routing inside table rows)
import { use } from "react";
