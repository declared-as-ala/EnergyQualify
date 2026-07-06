"use client";

import { useMemo, useState, use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  User,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Send
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CallStatusBadge, QualificationResultBadge } from "@/components/common/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, formatDuration, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const calls = useAppStore((s) => s.calls);
  const contacts = useAppStore((s) => s.contacts);
  const campaigns = useAppStore((s) => s.campaigns);
  const users = useAppStore((s) => s.users);
  const convertCallToDossier = useAppStore((s) => s.convertCallToDossier);

  const call = useMemo(() => calls.find((c) => c.id === id), [calls, id]);
  const contact = useMemo(() => (call ? contacts.find((c) => c.id === call.contactId) : undefined), [contacts, call]);
  const campaign = useMemo(() => (call ? campaigns.find((c) => c.id === call.campaignId) : undefined), [campaigns, call]);

  // Audio Mock State
  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(30);

  // Conversion Dialog State
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedCloserId, setSelectedCloserId] = useState("");

  const closers = useMemo(() => {
    return users.filter((u) => u.role === "CLOSER");
  }, [users]);

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-heading font-bold text-foreground">Appel introuvable</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Cet appel n&apos;existe pas ou a été supprimé.
        </p>
        <Button className="mt-4" render={<Link href="/appels" />} nativeButton={false}>
          Retour à l&apos;historique
        </Button>
      </div>
    );
  }

  const handleConvert = () => {
    if (!selectedCloserId) return;
    convertCallToDossier(call.id, selectedCloserId);
    setConvertOpen(false);
    router.push("/dossiers");
  };

  return (
    <div className="space-y-6">
      {/* Page Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/appels" />} className="rounded-full shrink-0" nativeButton={false}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-heading font-black tracking-tight text-foreground truncate">
              Appel · {contact ? fullName(contact) : "Inconnu"}
            </h2>
            <CallStatusBadge status={call.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            Campagne : {campaign ? campaign.name : "Inconnu"}
          </p>
        </div>

        {/* Manual conversion override button */}
        {call.qualificationResult !== "QUALIFIED" && (
          <Button
            size="sm"
            className="gap-1.5 font-heading font-bold shadow-xs shrink-0"
            onClick={() => {
              if (closers.length > 0) setSelectedCloserId(closers[0].id);
              setConvertOpen(true);
            }}
          >
            <Sparkles className="h-4 w-4" /> Convertir en dossier
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Call Transcript & Dialogue Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audio Player Card (Mock) */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground">Enregistrement audio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 bg-muted/10 border border-border/30 rounded-xl p-4">
                <button
                  onClick={() => setPlaying(!playing)}
                  className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-100 transition-all shadow-md"
                >
                  {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                </button>
                <div className="flex-1 space-y-1">
                  <div className="h-1.5 w-full bg-muted border border-border/20 rounded-full overflow-hidden relative">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-primary transition-all duration-300"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>{playing ? "01:03" : "00:00"}</span>
                    <span>{call.durationSec ? formatDuration(call.durationSec) : "00:00"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transcript Feed */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading font-bold">Transcription de l&apos;appel</CardTitle>
              <CardDescription className="text-[10px]">Dialogue complet extrait par l&apos;agent IA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!call.transcript || call.transcript.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground">Aucune transcription disponible pour cet appel.</div>
              ) : (
                <div className="space-y-3.5">
                  {call.transcript.map((turn, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-col max-w-[85%] rounded-xl p-3 text-xs leading-relaxed",
                        turn.speaker === "agent"
                          ? "bg-primary/5 border border-primary/10 text-foreground self-start"
                          : "bg-muted/40 border border-border/40 text-foreground/80 self-end ml-auto"
                      )}
                    >
                      <div className="flex justify-between items-baseline gap-4 mb-1">
                        <span className="font-heading font-black text-[9px] uppercase tracking-wider text-muted-foreground">
                          {turn.speaker === "agent" ? "IA Assistant" : "Prospect"}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground">{turn.timestamp}</span>
                      </div>
                      <span>{turn.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metadata details, objects logs */}
        <div className="space-y-6">
          {/* AI Qualification verdict */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground">Verdict Qualification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <span className="text-xs text-muted-foreground font-heading">Résultat final</span>
                <QualificationResultBadge result={call.qualificationResult} />
              </div>
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <span className="text-xs text-muted-foreground font-heading">Indice de confiance IA</span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {call.aiConfidence ? `${Math.round(call.aiConfidence * 100)}%` : "—"}
                </span>
              </div>
              {call.summary && (
                <div className="space-y-1.5 leading-normal">
                  <p className="text-xs text-muted-foreground font-heading">Résumé généré :</p>
                  <p className="text-xs text-foreground/90 italic bg-muted/20 border border-border/20 p-2.5 rounded-lg">
                    {call.summary}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Objections Log */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground">Objections détectées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {call.detectedObjections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Aucune objection relevée.</p>
              ) : (
                call.detectedObjections.map((o) => (
                  <div key={o} className="flex items-center gap-2 p-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 rounded-lg text-xs leading-normal">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="font-heading font-semibold">{o}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Call metadata timeline */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-heading font-black uppercase tracking-wider text-muted-foreground">Détails chronologiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-[10px]">Date de l&apos;appel</p>
                  <p className="font-semibold mt-0.5 text-foreground/95">{formatDateTime(call.startedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-[10px]">Durée de communication</p>
                  <p className="font-semibold mt-0.5 text-foreground/95">{call.durationSec ? formatDuration(call.durationSec) : "—"}</p>
                </div>
              </div>
              {call.assignedCloserId && (
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-[10px]">Closer Assigné</p>
                    <p className="font-semibold mt-0.5 text-foreground/95">
                      {users.find((u) => u.id === call.assignedCloserId)?.name || "Inconnu"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conversion Override Dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-md w-full border-border/50 bg-card/95 backdrop-blur-md rounded-xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-heading font-black text-foreground">
              <Sparkles className="h-4.5 w-4.5 text-primary" /> Validation manuelle du dossier
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              Forcer la qualification de cet appel. Un dossier sera généré et transféré au Closer sélectionné.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <Label>Closer responsable du closing</Label>
              <Select value={selectedCloserId} onValueChange={(val) => setSelectedCloserId(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {closers.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <DialogClose render={<Button variant="outline" className="font-heading font-bold" />}>Annuler</DialogClose>
            <Button onClick={handleConvert} disabled={!selectedCloserId} className="font-heading font-bold">
              Confirmer <Send className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
