"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Play,
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  Flame,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Plus
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/common/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { QUALIFICATION_FLOW, OBJECTIONS, DEFAULT_OPENING_MESSAGE, type FlowNodeId } from "@/lib/qualification";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/lib/types";

const STEPS = ["Général", "Audience", "Critères & Flowchart", "Script de l'agent", "Validation & Lancement"];

export default function NewCampaignPage() {
  const router = useRouter();
  const imports = useAppStore((s) => s.imports);
  const createCampaign = useAppStore((s) => s.createCampaign);

  const [step, setStep] = useState(0);

  // Form State
  const [name, setName] = useState("");
  const [offer, setOffer] = useState("");
  const [targetSegment, setTargetSegment] = useState("");
  const [selectedImportId, setSelectedImportId] = useState("");
  const [voiceProvider, setVoiceProvider] = useState<"MOCK" | "VAPI">("MOCK");
  const [callHoursStart, setCallHoursStart] = useState("09:00");
  const [callHoursEnd, setCallHoursEnd] = useState("19:00");

  const [excludeBrussels, setExcludeBrussels] = useState(true);
  const [excludeSocialTariff, setExcludeSocialTariff] = useState(true);
  const [requireInterest, setRequireInterest] = useState(true);

  const [openingMessage, setOpeningMessage] = useState(DEFAULT_OPENING_MESSAGE);
  const [pilotSize, setPilotSize] = useState(50);

  // Simulator State
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simNodeId, setSimNodeId] = useState<FlowNodeId>("start");
  const [simTurns, setSimTurns] = useState<{ speaker: "agent" | "contact"; text: string }[]>([]);
  const [simExtracted, setSimExtracted] = useState<Record<string, string>>({});

  // Helper: Find selected import name
  const selectedImportName = useMemo(() => {
    return imports.find((i) => i.id === selectedImportId)?.fileName || "—";
  }, [imports, selectedImportId]);

  const handleLaunch = () => {
    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      name: name || "Campagne Sans Nom",
      offer: offer || "Offre standard",
      targetSegment: targetSegment || "Tous segments",
      status: "READY",
      voiceProvider,
      callHoursStart,
      callHoursEnd,
      callDaysOfWeek: [1, 2, 3, 4, 5],
      pilotSize,
      rules: {
        excludeBrussels,
        excludeSocialTariff,
        requireInterest,
        requiredFields: ["firstName", "lastName", "address", "email", "phone", "dateOfBirth", "eanCode", "supplier"],
      },
      checklist: {
        contactListReviewed: true,
        doNotContactApplied: true,
        callHoursConfigured: true,
        scriptReviewed: true,
        dataFieldsApproved: true,
        pilotScopeConfirmed: true,
      },
      createdAt: new Date().toISOString(),
    };

    createCampaign(newCamp);
    router.push("/campagnes");
  };

  // Simulator Actions
  const startSimulation = () => {
    setSimNodeId("start");
    setSimTurns([
      {
        speaker: "agent",
        text: openingMessage,
      },
    ]);
    setSimExtracted({});
    setSimulatorOpen(true);
  };

  const handleSimChoice = (choice: string, nextNodeId: FlowNodeId, dataPatch?: Record<string, string>) => {
    // Add user turn
    const updatedTurns = [...simTurns, { speaker: "contact" as const, text: choice }];

    // Prepare agent question for next node
    let agentResponse = "";
    if (nextNodeId === "ask_brussels") {
      agentResponse = "Habitez-vous en Région de Bruxelles-Capitale ?";
    } else if (nextNodeId === "disqualified_brussels") {
      agentResponse = "Merci. Notre pilote ne couvre malheureusement pas Bruxelles. Bonne journée.";
    } else if (nextNodeId === "ask_social_tariff") {
      agentResponse = "D'accord. Bénéficiez-vous actuellement du tarif social de l'énergie ?";
    } else if (nextNodeId === "disqualified_social_tariff") {
      agentResponse = "Je comprends. Notre offre ne s'applique malheureusement pas au tarif social. Bonne journée.";
    } else if (nextNodeId === "ask_interest") {
      agentResponse = "D'accord. Seriez-vous intéressé(e) par une comparaison gratuite de votre facture énergétique ?";
    } else if (nextNodeId === "not_interested") {
      agentResponse = "Je comprends tout à fait. Merci pour votre temps. Bonne journée.";
    } else if (nextNodeId === "collect_supplier") {
      agentResponse = "Parfait. Quel est votre fournisseur d'énergie actuel ?";
    } else if (nextNodeId === "collect_identity") {
      agentResponse = "Merci. Puis-je avoir votre nom et prénom ?";
    } else if (nextNodeId === "collect_address") {
      agentResponse = "Noté. Quelle est votre adresse complète ?";
    } else if (nextNodeId === "collect_contact_details") {
      agentResponse = "Merci. Quelle est votre adresse e-mail pour recevoir le récapitulatif ?";
    } else if (nextNodeId === "collect_dob") {
      agentResponse = "Quelle est votre date de naissance ?";
    } else if (nextNodeId === "collect_ean") {
      agentResponse = "Parfait. Auriez-vous votre code EAN sous les yeux ? Il commence par 541.";
    } else if (nextNodeId === "offer_callback_or_close") {
      agentResponse = "Je vous remercie. Souhaitez-vous planifier un appel avec un conseiller pour valider l'offre ?";
    } else if (nextNodeId === "callback_scheduled") {
      agentResponse = "C'est noté. Un conseiller vous rappellera. Merci et bonne journée.";
    } else if (nextNodeId === "qualified_dossier") {
      agentResponse = "Votre dossier est complet et a été transmis à notre conseiller. Merci beaucoup et bonne journée !";
    }

    setSimTurns([...updatedTurns, { speaker: "agent", text: agentResponse }]);
    setSimNodeId(nextNodeId);
    if (dataPatch) {
      setSimExtracted({ ...simExtracted, ...dataPatch });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/campagnes" />} className="rounded-full shrink-0" nativeButton={false}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-heading font-black tracking-tight text-foreground">
            Nouvelle Campagne
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Configurez et lancez une campagne de qualification.</p>
        </div>
      </div>

      {/* Step Wizard Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/40">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-heading font-black border",
                i < step
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : i === step
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
              )}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span className={cn("text-xs font-heading font-bold", i === step ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 0: General Info */}
          {step === 0 && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
              <CardHeader>
                <CardTitle className="text-sm font-heading font-bold">Informations Générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nom de la campagne</Label>
                  <Input
                    placeholder="Ex: Énergie Wallonie – Juillet"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Offre de comparaison</Label>
                  <Input
                    placeholder="Ex: Comparaison de tarifs électricité & gaz résidentiels"
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Segment ciblé</Label>
                  <Input
                    placeholder="Ex: Familles, propriétaires en Province de Namur"
                    value={targetSegment}
                    onChange={(e) => setTargetSegment(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Heure début appels</Label>
                    <Input
                      type="time"
                      value={callHoursStart}
                      onChange={(e) => setCallHoursStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Heure fin appels</Label>
                    <Input
                      type="time"
                      value={callHoursEnd}
                      onChange={(e) => setCallHoursEnd(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Audience */}
          {step === 1 && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
              <CardHeader>
                <CardTitle className="text-sm font-heading font-bold">Liste de contacts</CardTitle>
                <CardDescription className="text-[10px]">
                  Sélectionnez le fichier importé contenant les prospects à appeler.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {imports.length === 0 ? (
                  <div className="text-center py-6 border rounded-xl border-dashed">
                    <AlertTriangle className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold">Aucun fichier importé</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Veuillez importer une liste de contacts avant de lancer une campagne.
                    </p>
                    <Button render={<Link href="/import" />} className="mt-3" size="sm" nativeButton={false}>
                      Importer maintenant
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {imports.map((imp) => (
                      <label
                        key={imp.id}
                        onClick={() => setSelectedImportId(imp.id)}
                        className={cn(
                          "flex items-center gap-4 rounded-xl border p-4 cursor-pointer hover:bg-muted/30 transition-all",
                          selectedImportId === imp.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                            : "border-border/60"
                        )}
                      >
                        <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-heading font-bold text-foreground truncate">{imp.fileName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {imp.validRows} contacts valides · Importé le {new Date(imp.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <input
                          type="radio"
                          name="import-selection"
                          checked={selectedImportId === imp.id}
                          readOnly
                          className="h-4 w-4 accent-primary"
                        />
                      </label>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <Label>Taille de l&apos;échantillon pilote</Label>
                  <Input
                    type="number"
                    value={pilotSize}
                    onChange={(e) => setPilotSize(Number(e.target.value))}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Nombre maximum de contacts de cette liste à appeler pour ce pilote.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Rules & Flowchart */}
          {step === 2 && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
              <CardHeader>
                <CardTitle className="text-sm font-heading font-bold">Critères d&apos;Éligibilité (Belgique)</CardTitle>
                <CardDescription className="text-[10px]">
                  Règles de qualification appliquées automatiquement par l&apos;assistant IA.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      checked={excludeBrussels}
                      onCheckedChange={(c) => setExcludeBrussels(Boolean(c))}
                      className="mt-0.5"
                    />
                    <div>
                      <Label className="text-xs font-heading font-bold cursor-pointer">Exclure la Région de Bruxelles-Capitale</Label>
                      <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                        Exclut les codes postaux 1000-1299. La prospection y est restreinte pour ce pilote.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-3 border-t border-border/20">
                    <Checkbox
                      checked={excludeSocialTariff}
                      onCheckedChange={(c) => setExcludeSocialTariff(Boolean(c))}
                      className="mt-0.5"
                    />
                    <div>
                      <Label className="text-xs font-heading font-bold cursor-pointer">Exclure le Tarif Social</Label>
                      <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                        Si le client signale bénéficier du tarif social de l&apos;énergie, l&apos;appel s&apos;arrête poliment.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-3 border-t border-border/20">
                    <Checkbox
                      checked={requireInterest}
                      onCheckedChange={(c) => setRequireInterest(Boolean(c))}
                      className="mt-0.5"
                    />
                    <div>
                      <Label className="text-xs font-heading font-bold cursor-pointer">Vérification de l&apos;intérêt commercial</Label>
                      <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                        L&apos;assistant s&apos;assure que l&apos;interlocuteur souhaite comparer son tarif avant de collecter des données sensibles.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Flowchart Diagram Visualization */}
                <div className="space-y-3 pt-4 border-t border-border/40">
                  <p className="text-xs font-heading font-bold text-muted-foreground">Logique séquentielle (Qualification Flow)</p>
                  <div className="bg-muted/10 border border-border/30 rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
                    {QUALIFICATION_FLOW.map((node, idx) => {
                      const colors = {
                        start: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                        question: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
                        collect: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                        "outcome-success": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        "outcome-fail": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                        "outcome-warning": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                      }[node.kind];

                      return (
                        <div key={node.id} className="flex flex-col items-center">
                          <div className={cn("w-full max-w-md p-2 rounded-lg border text-xs text-center font-heading font-semibold", colors)}>
                            {node.label}
                          </div>
                          {idx < QUALIFICATION_FLOW.length - 1 && (
                            <div className="h-4 w-px border-l-2 border-dashed border-border/60 my-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Call Script */}
          {step === 3 && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
              <CardHeader>
                <CardTitle className="text-sm font-heading font-bold">Script de l&apos;Assistant IA</CardTitle>
                <CardDescription className="text-[10px]">
                  Configurez les réponses initiales et objection de l&apos;agent.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Message d&apos;ouverture</Label>
                  <textarea
                    rows={4}
                    className="w-full text-xs p-3 border border-border/50 rounded-lg bg-background outline-none focus:border-primary/50 transition-colors"
                    value={openingMessage}
                    onChange={(e) => setOpeningMessage(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Le message d&apos;introduction énoncé dès que le correspondant décroche.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <p className="text-xs font-heading font-bold text-muted-foreground">Traitement des objections</p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {OBJECTIONS.map((o) => (
                      <div key={o.id} className="bg-muted/15 border border-border/30 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex justify-between items-center gap-4">
                          <span className="font-heading font-bold text-foreground/90">Objection : « {o.phrase} »</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-heading font-bold">{o.action}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic mt-0.5">Réponse IA : « {o.aiResponse} »</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Launch Checklist */}
          {step === 4 && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
              <CardHeader>
                <CardTitle className="text-sm font-heading font-bold">Validation finale & Lancement</CardTitle>
                <CardDescription className="text-[10px]">
                  Vérifiez tous les paramètres de votre campagne pilote.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2 bg-muted/20 border border-border/30 rounded-xl p-4 leading-normal">
                  <p className="font-heading font-bold text-foreground">Résumé de la configuration :</p>
                  <ul className="space-y-1 list-disc list-inside text-muted-foreground mt-1">
                    <li>Nom : <span className="text-foreground font-semibold">{name || "Énergie pilote"}</span></li>
                    <li>Offre : <span className="text-foreground">{offer || "Comparaison tarif"}</span></li>
                    <li>Fichier d&apos;audience : <span className="text-foreground">{selectedImportName}</span></li>
                    <li>Taille du pilote : <span className="text-foreground font-mono font-bold">{pilotSize}</span> contacts</li>
                    <li>Créneaux autorisés : <span className="text-foreground font-semibold">{callHoursStart} - {callHoursEnd}</span></li>
                  </ul>
                </div>

                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20 mt-4 leading-snug">
                  <ShieldCheck className="h-5 w-5 shrink-0" />
                  <span>
                    Conformité validée : Ce script respecte la clause de transparence (l&apos;IA s&apos;annonce comme assistant automatisé) et applique le filtrage DNC.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Steps Navigation buttons */}
          <div className="flex justify-between items-center gap-2 pt-4 border-t border-border/40">
            <Button
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              className="font-heading font-bold"
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>

            {step === STEPS.length - 1 ? (
              <Button onClick={handleLaunch} className="gap-1.5 font-heading font-bold">
                Créer & Activer <CheckCircle2 className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setStep((s) => s + 1)}
                className="gap-1.5 font-heading font-bold"
                disabled={step === 1 && !selectedImportId} // Force audience selection
              >
                Suivant <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Flow chart indicator / Conversation Simulator */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs sticky top-20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-xs font-heading font-black uppercase tracking-wider">
                  Test de Dialogue
                </CardTitle>
              </div>
              <CardDescription className="text-[10px] mt-0.5">
                Simulez une conversation vocale avec l&apos;assistant IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-normal">
                Lancez un simulateur interactif pour vérifier les comportements, objections, et extractions de données en temps réel.
              </p>
              <Button onClick={startSimulation} className="w-full gap-2 font-heading font-bold">
                <Play className="h-4 w-4" /> Tester la conversation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Simulator Modal Dialog */}
      <Dialog open={simulatorOpen} onOpenChange={setSimulatorOpen}>
        <DialogContent className="max-w-xl w-full border-border/50 bg-card/95 backdrop-blur-md rounded-xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-heading font-black text-foreground">
              <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" /> Simulateur de Pré-qualification IA
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              Validez la logique décisionnelle de l&apos;agent. Choisissez les réponses à donner à l&apos;IA.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            {/* Left: Dialogue feed */}
            <div className="md:col-span-2 flex flex-col justify-between border border-border/40 rounded-xl p-3 bg-background/50 h-80">
              <div className="space-y-3 overflow-y-auto max-h-60 pr-1 text-xs">
                {simTurns.map((turn, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col max-w-[85%] rounded-lg p-2.5 leading-relaxed",
                      turn.speaker === "agent"
                        ? "bg-primary/10 border border-primary/20 text-foreground self-start"
                        : "bg-muted border border-border/50 text-foreground/80 self-end ml-auto"
                    )}
                  >
                    <span className="font-heading font-black text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">
                      {turn.speaker === "agent" ? "IA Assistant" : "Prospect"}
                    </span>
                    <span>{turn.text}</span>
                  </div>
                ))}
              </div>

              {/* Input choices based on currentNodeId */}
              <div className="pt-3 border-t border-border/40 flex flex-wrap gap-1.5">
                {simNodeId === "start" && (
                  <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("Oui, allez-y, je vous écoute.", "ask_brussels")}>
                    Oui, allez-y
                  </Button>
                )}
                {simNodeId === "ask_brussels" && (
                  <>
                    <Button size="xs" variant="outline" className="font-heading font-semibold" onClick={() => handleSimChoice("Oui, j'habite à Bruxelles.", "disqualified_brussels")}>
                      Oui, à Bruxelles
                    </Button>
                    <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("Non, j'habite à Namur.", "ask_social_tariff")}>
                      Non, à Namur
                    </Button>
                  </>
                )}
                {simNodeId === "ask_social_tariff" && (
                  <>
                    <Button size="xs" variant="outline" className="font-heading font-semibold" onClick={() => handleSimChoice("Oui, je reçois le tarif social.", "disqualified_social_tariff")}>
                      Oui, tarif social
                    </Button>
                    <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("Non, pas du tout.", "ask_interest")}>
                      Non, pas du tout
                    </Button>
                  </>
                )}
                {simNodeId === "ask_interest" && (
                  <>
                    <Button size="xs" variant="outline" className="font-heading font-semibold" onClick={() => handleSimChoice("Non, ça ne m'intéresse pas.", "not_interested")}>
                      Non, pas intéressé
                    </Button>
                    <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("Oui, pourquoi pas.", "collect_supplier")}>
                      Oui, intéressé
                    </Button>
                  </>
                )}
                {simNodeId === "collect_supplier" && (
                  <>
                    <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("Je suis chez Engie Electrabel.", "collect_identity", { supplier: "Engie" })}>
                      Engie Electrabel
                    </Button>
                    <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("Je suis chez Luminus.", "collect_identity", { supplier: "Luminus" })}>
                      Luminus
                    </Button>
                  </>
                )}
                {simNodeId === "collect_identity" && (
                  <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("Je m'appelle Jean Dupont.", "collect_address", { firstName: "Jean", lastName: "Dupont" })}>
                    Jean Dupont
                  </Button>
                )}
                {simNodeId === "collect_address" && (
                  <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("J'habite Rue de Fer 12, 5000 Namur.", "collect_contact_details", { address: "Rue de Fer 12", city: "Namur", postalCode: "5000" })}>
                    Rue de Fer 12, Namur
                  </Button>
                )}
                {simNodeId === "collect_contact_details" && (
                  <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("Mon e-mail est jean.dupont@gmail.com.", "collect_dob", { email: "jean.dupont@gmail.com" })}>
                    jean.dupont@gmail.com
                  </Button>
                )}
                {simNodeId === "collect_dob" && (
                  <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("Je suis né le 12/04/1985.", "collect_ean", { dateOfBirth: "12/04/1985" })}>
                    12/04/1985
                  </Button>
                )}
                {simNodeId === "collect_ean" && (
                  <>
                    <Button size="xs" variant="outline" className="font-heading font-semibold" onClick={() => handleSimChoice("Je préfère ne pas donner mon code EAN.", "offer_callback_or_close")}>
                      Refuser l&apos;EAN
                    </Button>
                    <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("Mon code EAN est le 541448877665544.", "offer_callback_or_close", { eanCode: "541448877665544" })}>
                      Donner EAN
                    </Button>
                  </>
                )}
                {simNodeId === "offer_callback_or_close" && (
                  <>
                    <Button size="xs" variant="outline" className="font-heading font-semibold" onClick={() => handleSimChoice("Non, finalisons le dossier.", "qualified_dossier")}>
                      Finaliser maintenant
                    </Button>
                    <Button size="xs" className="font-heading font-semibold" onClick={() => handleSimChoice("Oui, rappelons-moi demain.", "callback_scheduled")}>
                      Planifier rappel
                    </Button>
                  </>
                )}

                {["disqualified_brussels", "disqualified_social_tariff", "not_interested", "callback_scheduled", "qualified_dossier"].includes(simNodeId) && (
                  <Button size="xs" className="font-heading font-bold" onClick={startSimulation}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Recommencer
                  </Button>
                )}
              </div>
            </div>

            {/* Right: Real-time Extracted Data */}
            <div className="border border-border/40 rounded-xl p-3 bg-muted/20 flex flex-col justify-between text-xs space-y-3">
              <div>
                <p className="font-heading font-black text-[9px] uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/40">
                  Données Extraintes
                </p>
                <div className="space-y-1.5 mt-2 font-medium">
                  <div>
                    <span className="text-muted-foreground text-[10px]">Nom complet : </span>
                    <span className="text-foreground truncate block">{simExtracted.firstName ? `${simExtracted.firstName} ${simExtracted.lastName}` : "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">Ville : </span>
                    <span className="text-foreground block">{simExtracted.city ? `${simExtracted.city} (${simExtracted.postalCode})` : "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">Fournisseur : </span>
                    <span className="text-foreground block">{simExtracted.supplier || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">E-mail : </span>
                    <span className="text-foreground truncate block">{simExtracted.email || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px]">EAN : </span>
                    <span className="text-foreground font-mono block">{simExtracted.eanCode || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/30 text-[10px] leading-normal">
                <span className="text-muted-foreground block">Statut final de qualification :</span>
                <span className={cn(
                  "font-heading font-black uppercase tracking-wider mt-1 block",
                  simNodeId === "qualified_dossier" && "text-emerald-600",
                  ["disqualified_brussels", "disqualified_social_tariff"].includes(simNodeId) && "text-red-500",
                  simNodeId === "callback_scheduled" && "text-blue-500",
                  simNodeId === "not_interested" && "text-amber-500",
                  !["qualified_dossier", "disqualified_brussels", "disqualified_social_tariff", "callback_scheduled", "not_interested"].includes(simNodeId) && "text-muted-foreground"
                )}>
                  {simNodeId === "qualified_dossier" ? "Qualifié" :
                   simNodeId === "disqualified_brussels" ? "Exclus Bruxelles" :
                   simNodeId === "disqualified_social_tariff" ? "Exclus Tarif social" :
                   simNodeId === "callback_scheduled" ? "Rappel planifié" :
                   simNodeId === "not_interested" ? "Pas intéressé" : "En cours..."}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <DialogClose render={<Button variant="outline" className="font-heading font-bold" />}>Fermer</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
