"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Settings,
  MessageSquare,
  ShieldCheck,
  Plus,
  Trash2,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Save,
  Languages
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { REQUIRED_DOSSIER_FIELDS } from "@/lib/qualification";
import { cn } from "@/lib/utils";

export default function AgentScriptPage() {
  const agentConfig = useAppStore((s) => s.agentConfig);
  const demoMode = useAppStore((s) => s.demoMode);
  const setDemoMode = useAppStore((s) => s.setDemoMode);
  const updateAgentConfig = useAppStore((s) => s.updateAgentConfig);

  // Form States
  const [name, setName] = useState(agentConfig.name);
  const [language, setLanguage] = useState(agentConfig.language);
  const [speakingStyle, setSpeakingStyle] = useState(agentConfig.speakingStyle);
  const [openingMessage, setOpeningMessage] = useState(agentConfig.openingMessage);
  const [complianceNotice, setComplianceNotice] = useState(agentConfig.complianceNotice);

  // Objection Handling
  const [objections, setObjections] = useState(agentConfig.objectionHandling);

  // Required Fields selection
  const [requiredFields, setRequiredFields] = useState<string[]>(
    agentConfig.requiredFields || []
  );

  // Escalation Rules
  const [escalations, setEscalations] = useState<string[]>(agentConfig.escalationRules || []);
  const [newEscalation, setNewEscalation] = useState("");

  const handleSave = () => {
    updateAgentConfig({
      name,
      language,
      speakingStyle,
      openingMessage,
      objectionHandling: objections,
      requiredFields,
      escalationRules: escalations,
      complianceNotice,
    });
    toast.success("Configuration de l'agent IA enregistrée avec succès !");
  };

  const handleAddEscalation = () => {
    if (newEscalation.trim()) {
      setEscalations([...escalations, newEscalation.trim()]);
      setNewEscalation("");
    }
  };

  const handleRemoveEscalation = (idx: number) => {
    setEscalations(escalations.filter((_, i) => i !== idx));
  };

  const handleToggleField = (fieldLabel: string) => {
    if (requiredFields.includes(fieldLabel)) {
      setRequiredFields(requiredFields.filter((f) => f !== fieldLabel));
    } else {
      setRequiredFields([...requiredFields, fieldLabel]);
    }
  };

  const handleObjectionResponseChange = (idx: number, newResponse: string) => {
    setObjections(
      objections.map((o, i) => (i === idx ? { ...o, response: newResponse } : o))
    );
  };

  const FIELD_TRANSLATIONS: Record<string, string> = {
    firstName: "Prénom",
    lastName: "Nom",
    address: "Adresse complète",
    email: "E-mail",
    phone: "Téléphone",
    dateOfBirth: "Date de naissance",
    eanCode: "Code EAN",
    supplier: "Fournisseur actuel",
    interestLevel: "Niveau d'intérêt",
    notes: "Notes / résumé d'appel",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Script de l'agent IA"
        description="Configurez l'identité, le script vocal d'appel et les règles de traitement d'objections de votre assistant."
        action={
          <Button onClick={handleSave} className="gap-1.5 font-heading font-bold shadow-xs">
            <Save className="h-4 w-4" /> Enregistrer le script
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Core Configurations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity & Style */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading font-bold">Identité & Style Vocal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nom de l&apos;agent</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Langue parlée</Label>
                  <Input value={language} onChange={(e) => setLanguage(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Style de diction et ton</Label>
                <Input value={speakingStyle} onChange={(e) => setSpeakingStyle(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Opening message */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading font-bold">Message d&apos;ouverture réglementaire</CardTitle>
              <CardDescription className="text-[10px]">
                Introduction énoncée à l&apos;interlocuteur dès le décrochage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                rows={4}
                className="w-full text-xs p-3 border border-border/50 rounded-lg bg-background outline-none focus:border-primary/50 transition-colors"
                value={openingMessage}
                onChange={(e) => setOpeningMessage(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Objection Matrix */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading font-bold">Matrice de traitement des objections</CardTitle>
              <CardDescription className="text-[10px]">
                Réponses clés et actions de l&apos;assistant face aux retours des prospects.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {objections.map((o, idx) => (
                  <div key={o.objection} className="bg-muted/15 border border-border/30 rounded-xl p-3.5 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center gap-4">
                      <span className="font-heading font-black text-foreground/90">Objection : « {o.objection} »</span>
                      <span className="text-[9px] font-heading font-black uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {o.action}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Réponse vocale générée :</Label>
                      <textarea
                        rows={2}
                        className="w-full text-[11px] p-2 border border-border/40 rounded-lg bg-background outline-none focus:border-primary/40 transition-colors leading-relaxed"
                        value={o.response}
                        onChange={(e) => handleObjectionResponseChange(idx, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Criteria, Escalation, Compliance Toggles */}
        <div className="space-y-6">
          {/* Demo Mode Toggle */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-heading font-black uppercase tracking-wider">Mode Démo</CardTitle>
              <CardDescription className="text-[10px] mt-0.5">
                Exécutez de faux appels pilotes à des fins de test.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between gap-4 p-3 bg-muted/20 border border-border/30 rounded-xl">
                <div>
                  <p className="text-xs font-heading font-bold text-foreground">Mode Démonstration</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {demoMode ? "Aucun appel réel n'est passé." : "Appels de production actifs."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDemoMode(!demoMode)}
                  className="text-primary hover:scale-105 active:scale-100 transition-transform"
                >
                  {demoMode ? (
                    <ToggleRight className="h-9 w-9 text-primary fill-primary/10" />
                  ) : (
                    <ToggleLeft className="h-9 w-9 text-muted-foreground" />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Required Fields */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-heading font-black uppercase tracking-wider">Champs de données requis</CardTitle>
              <CardDescription className="text-[10px] mt-0.5">
                Champs de qualification récoltés obligatoirement par l&apos;IA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {Object.keys(FIELD_TRANSLATIONS).map((fieldKey) => {
                const label = FIELD_TRANSLATIONS[fieldKey];
                const isSelected = requiredFields.includes(label);
                return (
                  <div key={fieldKey} className="flex items-center gap-2.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleField(label)}
                    />
                    <span className="text-xs font-heading font-semibold text-foreground/80 cursor-pointer" onClick={() => handleToggleField(label)}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Escalation Rules */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-heading font-black uppercase tracking-wider">Règles de déviation / escalade</CardTitle>
              <CardDescription className="text-[10px] mt-0.5">
                Règles de repli appliquées en cours d&apos;appel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {escalations.map((rule, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 bg-muted/15 border border-border/20 p-2 rounded-lg text-xs leading-normal">
                    <span className="text-muted-foreground">{rule}</span>
                    <button
                      type="button"
                      className="text-destructive hover:text-destructive/80 shrink-0 mt-0.5"
                      onClick={() => handleRemoveEscalation(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-1.5 pt-2">
                <Input
                  placeholder="Nouvelle directive..."
                  value={newEscalation}
                  onChange={(e) => setNewEscalation(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button size="xs" onClick={handleAddEscalation} className="shrink-0 h-8 font-heading font-bold">
                  <Plus className="h-3 w-3" /> Ajouter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
