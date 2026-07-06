"use client";

import { useMemo, useState } from "react";
import {
  Users,
  Settings,
  Building,
  Key,
  ShieldCheck,
  CreditCard,
  Plus,
  Trash2,
  Mail,
  Webhook,
  Calendar,
  Lock
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ROLE_LABELS = {
  ADMIN: "Administrateur",
  CAMPAIGN_MANAGER: "Gestionnaire de campagne",
  CLOSER: "Closer commercial",
  VIEWER: "Lecteur seul",
};

export default function SettingsPage() {
  const users = useAppStore((s) => s.users);

  const [activeTab, setActiveTab] = useState("team");
  const [workspaceName, setWorkspaceName] = useState("Ecofix Energie");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Gérez les collaborateurs, configurez les intégrations d'API et administrez votre espace de travail."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="border-b border-border/40 pb-px mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="team" className="font-heading font-bold text-xs">Membres de l&apos;équipe</TabsTrigger>
          <TabsTrigger value="integrations" className="font-heading font-bold text-xs">Intégrations & API</TabsTrigger>
          <TabsTrigger value="workspace" className="font-heading font-bold text-xs">Espace de travail</TabsTrigger>
          <TabsTrigger value="security" className="font-heading font-bold text-xs">Sécurité & Rétention</TabsTrigger>
        </TabsList>

        {/* Tab 1: Team Members list */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-heading font-bold text-foreground">Utilisateurs actifs</h3>
              <p className="text-[10px] text-muted-foreground">
                Gérez les permissions d&apos;accès à la plateforme EnergyQualify.
              </p>
            </div>
            <Button size="xs" className="gap-1 font-heading font-bold shadow-xs">
              <Plus className="h-3.5 w-3.5" /> Inviter un membre
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.map((u) => (
              <Card
                key={u.id}
                className="border-border/40 bg-card/60 backdrop-blur-xs flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 border text-primary flex items-center justify-center font-heading font-bold text-xs">
                    {u.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-heading font-bold text-foreground truncate">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[8px] font-heading font-black uppercase tracking-wider mt-1.5">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </div>
                </div>

                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Integrations & API Placeholders */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CRM webhooks card */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Webhook className="h-4.5 w-4.5 text-primary" />
                  <CardTitle className="text-sm font-heading font-bold">Synchronisation CRM (Webhooks)</CardTitle>
                </div>
                <CardDescription className="text-[10px]">
                  Transférez automatiquement les dossiers qualifiés vers votre CRM commercial.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label>URL de notification (Endpoint URL)</Label>
                  <Input defaultValue="https://crm.ecofix.be/api/v1/dossiers/qualify" className="text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>Clé de sécurité (API Key)</Label>
                  <Input defaultValue="eq_live_884a22e89d8ff7b7fcc89" type="password" className="text-xs font-mono" />
                </div>
                <div className="pt-2 border-t border-border/40 flex justify-end">
                  <Button size="xs" className="font-heading font-bold shadow-xs">
                    Tester la connexion
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Voice Provider config placeholders */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Key className="h-4.5 w-4.5 text-primary" />
                  <CardTitle className="text-sm font-heading font-bold">Fournisseur de Voix IA (Vapi.ai)</CardTitle>
                </div>
                <CardDescription className="text-[10px]">
                  Paramétrez vos jetons Vapi pour passer des appels de production réels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label>Vapi API Key</Label>
                  <Input placeholder="vapi_private_key_..." type="password" className="text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>Identifiant Assistant vocal (Vapi Assistant ID)</Label>
                  <Input placeholder="ex: a1b2c3d4-e5f6-..." className="text-xs font-mono" />
                </div>
                <div className="pt-2 border-t border-border/40 flex justify-end">
                  <Button size="xs" className="font-heading font-bold shadow-xs">
                    Enregistrer les clés
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Workspace Config */}
        <TabsContent value="workspace" className="space-y-4">
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs max-w-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-sm font-heading font-bold">Fiche administrative</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label>Nom de la structure / Workspace</Label>
                <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail de support</Label>
                <Input defaultValue="support@ecofix.be" />
              </div>
              <div className="pt-2 border-t border-border/40 flex justify-end">
                <Button size="xs" className="font-heading font-bold shadow-xs">
                  Mettre à jour
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Security & Data Retention */}
        <TabsContent value="security" className="space-y-4">
          <Card className="border-border/40 bg-card/60 backdrop-blur-xs max-w-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-primary" />
                <CardTitle className="text-sm font-heading font-bold">Sécurité & Rétention des données (RGPD)</CardTitle>
              </div>
              <CardDescription className="text-[10px]">
                Gérez la conformité RGPD sur la rétention des enregistrements vocaux et données prospect.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label>Durée de rétention des enregistrements vocaux</Label>
                <Select defaultValue="90">
                  <SelectTrigger className="w-full text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30" className="text-xs">30 jours (Recommandé pilote)</SelectItem>
                    <SelectItem value="90" className="text-xs">90 jours</SelectItem>
                    <SelectItem value="180" className="text-xs">180 jours</SelectItem>
                    <SelectItem value="365" className="text-xs">1 an (Maximum)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-3 border-t border-border/40 flex justify-end">
                <Button size="xs" className="font-heading font-bold shadow-xs">
                  Enregistrer les choix
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
