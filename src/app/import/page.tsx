"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  FileSpreadsheet,
  ShieldAlert,
  Sparkles,
  Upload as UploadIcon,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { Contact, ContactImportSummary } from "@/lib/types";
import {
  INTERNAL_FIELDS,
  guessMapping,
  parseSpreadsheetFile,
  validateRows,
  type ColumnMapping,
  type ImportValidationResult,
  type ParsedSpreadsheet,
} from "@/lib/import";

const STEPS = ["Import", "Aperçu", "Mapping", "Validation", "Échantillon pilote", "Confirmation"];

export default function ImportPage() {
  const router = useRouter();
  const contacts = useAppStore((s) => s.contacts);
  const campaigns = useAppStore((s) => s.campaigns);
  const importContacts = useAppStore((s) => s.importContacts);

  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [pilotMode, setPilotMode] = useState<"all" | "50" | "100">("50");
  const [targetCampaign, setTargetCampaign] = useState<string>("draft");
  const [dragOver, setDragOver] = useState(false);

  const existingPhones = useMemo(
    () => new Set(contacts.map((c) => c.phone.replace(/[^\d]/g, ""))),
    [contacts],
  );

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const result = await parseSpreadsheetFile(file);
        if (result.rows.length === 0) {
          toast.error("Le fichier semble vide ou illisible.");
          return;
        }
        setParsed(result);
        setMapping(guessMapping(result.rows, result.hasHeader));
        setStep(1);
      } catch {
        toast.error("Impossible de lire ce fichier. Formats acceptés : .xlsx, .xls, .csv");
      }
    },
    [],
  );

  function runValidation() {
    if (!parsed) return;
    const result = validateRows(parsed.rows, mapping, parsed.hasHeader, existingPhones);
    setValidation(result);
    setStep(3);
  }

  function confirmImport() {
    if (!validation || !parsed) return;
    const eligible = validation.cleaned.filter((r) => !r.isInvalid && !r.isDuplicate && !r.isBrusselsGuess);
    const sampleSize = pilotMode === "all" ? eligible.length : pilotMode === "50" ? 50 : 100;
    const selected = eligible.slice(0, Math.min(sampleSize, eligible.length));

    const importId = `import-${Date.now()}`;
    const campaignId = targetCampaign === "draft" ? undefined : targetCampaign;
    const newContacts: Contact[] = selected.map((r, i) => ({
      id: `contact-import-${Date.now()}-${i}`,
      civility: r.civility,
      firstName: r.firstName,
      lastName: r.lastName,
      address: r.address,
      postalCode: r.postalCode,
      city: r.city,
      phone: r.phone,
      ageRange: r.ageRange,
      status: campaignId ? "READY_TO_CALL" : "IMPORTED",
      interestLevel: "INCONNU",
      score: 0,
      isDuplicate: false,
      isBrusselsGuess: false,
      campaignId,
      importId,
      createdAt: new Date().toISOString(),
    }));

    const summary: ContactImportSummary = {
      id: importId,
      fileName: parsed.fileName,
      totalRows: validation.totalRows,
      validRows: validation.validRows,
      duplicateRows: validation.duplicateRows,
      missingPhone: validation.missingPhone,
      brusselsRows: validation.brusselsRows,
      invalidRows: validation.invalidRows,
      createdAt: new Date().toISOString(),
    };

    importContacts(summary, newContacts);
    toast.success(`${newContacts.length} contact(s) importé(s) avec succès`);
    setStep(5);
  }

  return (
    <div>
      <PageHeader
        title="Importer une liste"
        description="Importez un fichier Excel ou CSV, nettoyez les doublons, puis constituez votre échantillon pilote."
      />

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold border",
                i < step
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : i === step
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn("text-sm", i === step ? "font-medium" : "text-muted-foreground")}>{label}</span>
            {i < STEPS.length - 1 && <div className="h-px w-6 bg-border" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardContent
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 text-center transition-colors m-4",
              dragOver ? "border-primary bg-primary/5" : "border-border",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <h3 className="font-semibold mb-1.5">Glissez-déposez votre fichier ici</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-5">
              Formats acceptés : .xlsx, .xls, .csv. Colonnes attendues : Civilité, Nom, Prénom, Adresse, Code postal, Ville,
              Téléphone, Tranche d&apos;âge.
            </p>
            <Button render={<label htmlFor="file-input" />} nativeButton={false} className="cursor-pointer">
              <UploadIcon className="h-4 w-4" /> Choisir un fichier
            </Button>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </CardContent>
        </Card>
      )}

      {step === 1 && parsed && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Aperçu du fichier</h3>
                <p className="text-sm text-muted-foreground">
                  {parsed.fileName} · {parsed.rows.length - (parsed.hasHeader ? 1 : 0)} lignes détectées
                  {parsed.hasHeader ? " (en-tête détecté)" : " (sans en-tête)"}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableBody>
                  {parsed.rows.slice(0, 6).map((row, i) => (
                    <TableRow key={i} className={i === 0 && parsed.hasHeader ? "bg-muted/50 font-medium" : undefined}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="whitespace-nowrap">
                          {cell || "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                Retour
              </Button>
              <Button onClick={() => setStep(2)}>Continuer vers le mapping</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && parsed && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="font-semibold">Associer les colonnes</h3>
              <p className="text-sm text-muted-foreground">
                Indiquez à quelle colonne du fichier correspond chaque champ interne.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INTERNAL_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label>
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Select
                    value={mapping[field.key] !== undefined ? String(mapping[field.key]) : "none"}
                    onValueChange={(v) =>
                      setMapping((m) => ({ ...m, [field.key]: v === "none" ? undefined : Number(v) }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non mappé</SelectItem>
                      {parsed.rows[0]?.map((_, colIdx) => (
                        <SelectItem key={colIdx} value={String(colIdx)}>
                          Colonne {colIdx + 1}
                          {parsed.hasHeader ? ` — "${parsed.rows[0][colIdx]}"` : ""}
                          {" · ex: "}
                          {parsed.rows[parsed.hasHeader ? 1 : 0]?.[colIdx] || "—"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button onClick={runValidation}>Valider les données</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && validation && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatTile label="Lignes totales" value={validation.totalRows} />
            <StatTile label="Valides" value={validation.validRows} tone="success" />
            <StatTile label="Doublons" value={validation.duplicateRows} tone="warning" />
            <StatTile label="Tél. manquant" value={validation.missingPhone} tone="danger" />
            <StatTile label="Zone Bruxelles" value={validation.brusselsRows} tone="danger" />
            <StatTile label="Invalides" value={validation.invalidRows} tone="danger" />
          </div>

          {validation.brusselsRows > 0 && (
            <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="flex items-start gap-3 p-4">
                <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {validation.brusselsRows} contact(s) semblent résider en Région de Bruxelles-Capitale. Conformément aux
                  règles de qualification du pilote, ils seront automatiquement exclus de l&apos;échantillon.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold">Aperçu des données nettoyées</h3>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validation.cleaned.slice(0, 8).map((r) => (
                      <TableRow key={r.rowIndex}>
                        <TableCell>
                          {r.firstName} {r.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.city} {r.postalCode}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">{r.phone || "—"}</TableCell>
                        <TableCell>
                          {r.isInvalid ? (
                            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                              {r.issues[0]}
                            </Badge>
                          ) : r.isDuplicate ? (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                              Doublon
                            </Badge>
                          ) : r.isBrusselsGuess ? (
                            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                              Zone Bruxelles
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                              Valide
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Retour au mapping
                </Button>
                <Button onClick={() => setStep(4)}>
                  <Sparkles className="h-4 w-4" /> Créer un échantillon pilote
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 4 && validation && (
        <Card>
          <CardContent className="p-5 space-y-5">
            <div>
              <h3 className="font-semibold">Constituer l&apos;échantillon pilote</h3>
              <p className="text-sm text-muted-foreground">
                {validation.cleaned.filter((r) => !r.isInvalid && !r.isDuplicate && !r.isBrusselsGuess).length} contacts
                valides et éligibles sont disponibles.
              </p>
            </div>

            <RadioGroup value={pilotMode} onValueChange={(v) => setPilotMode(v as typeof pilotMode)} className="gap-3">
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
                <RadioGroupItem value="50" />
                <div>
                  <p className="text-sm font-medium">50 contacts (échantillon standard)</p>
                  <p className="text-xs text-muted-foreground">Sélection aléatoire parmi les contacts valides.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
                <RadioGroupItem value="100" />
                <div>
                  <p className="text-sm font-medium">100 contacts</p>
                  <p className="text-xs text-muted-foreground">Pour un pilote plus large.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
                <RadioGroupItem value="all" />
                <div>
                  <p className="text-sm font-medium">Importer tous les contacts valides</p>
                  <p className="text-xs text-muted-foreground">Pas de limite d&apos;échantillon.</p>
                </div>
              </label>
            </RadioGroup>

            <div className="space-y-1.5">
              <Label>Assigner à</Label>
              <Select value={targetCampaign} onValueChange={(val) => setTargetCampaign(val ?? "draft")}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Enregistrer en brouillon (non assigné)</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                Retour
              </Button>
              <Button onClick={confirmImport}>Confirmer l&apos;import</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardContent className="flex flex-col items-center text-center p-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="font-semibold text-lg mb-1.5">Import terminé</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Vos contacts ont été importés avec succès. Vous pouvez maintenant les consulter ou créer une campagne.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/contacts")}>
                <Users className="h-4 w-4" /> Voir les contacts
              </Button>
              <Button onClick={() => router.push("/campagnes/nouveau")}>Créer une campagne</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-xl font-semibold tabular-nums mt-1", toneClass)}>{value}</p>
      </CardContent>
    </Card>
  );
}
