import type {
  CallStatus,
  CampaignStatus,
  ContactStatus,
  DossierStatus,
  QualificationResult,
} from "@/lib/types";

export const CONTACT_STATUS_META: Record<
  ContactStatus,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" | "orange" }
> = {
  IMPORTED: { label: "Importé", tone: "neutral" },
  READY_TO_CALL: { label: "Prêt à appeler", tone: "info" },
  CALLING: { label: "Appel en cours", tone: "info" },
  NO_ANSWER: { label: "Sans réponse", tone: "neutral" },
  CALLBACK_REQUESTED: { label: "Rappel demandé", tone: "orange" },
  NOT_INTERESTED: { label: "Pas intéressé", tone: "neutral" },
  DISQUALIFIED_BRUSSELS: { label: "Disqualifié : Bruxelles", tone: "danger" },
  DISQUALIFIED_SOCIAL_TARIFF: { label: "Disqualifié : tarif social", tone: "danger" },
  INTERESTED_INCOMPLETE_DOSSIER: { label: "Intéressé – dossier incomplet", tone: "warning" },
  QUALIFIED_DOSSIER: { label: "Dossier qualifié", tone: "success" },
  DO_NOT_CONTACT: { label: "Ne pas contacter", tone: "danger" },
  FAILED_CALL: { label: "Échec d'appel", tone: "danger" },
};

export const CAMPAIGN_STATUS_META: Record<CampaignStatus, { label: string; tone: string }> = {
  DRAFT: { label: "Brouillon", tone: "neutral" },
  READY: { label: "Prête", tone: "info" },
  RUNNING: { label: "En cours", tone: "success" },
  PAUSED: { label: "En pause", tone: "orange" },
  COMPLETED: { label: "Terminée", tone: "info" },
  ARCHIVED: { label: "Archivée", tone: "neutral" },
};

export const CALL_STATUS_META: Record<CallStatus, { label: string; tone: string }> = {
  SCHEDULED: { label: "Planifié", tone: "neutral" },
  IN_PROGRESS: { label: "En cours", tone: "info" },
  COMPLETED: { label: "Terminé", tone: "success" },
  NO_ANSWER: { label: "Sans réponse", tone: "neutral" },
  FAILED: { label: "Échec", tone: "danger" },
  VOICEMAIL: { label: "Messagerie", tone: "neutral" },
};

export const QUALIFICATION_RESULT_META: Record<
  QualificationResult,
  { label: string; tone: string }
> = {
  QUALIFIED: { label: "Qualifié", tone: "success" },
  DISQUALIFIED_BRUSSELS: { label: "Disqualifié – Bruxelles", tone: "danger" },
  DISQUALIFIED_SOCIAL_TARIFF: { label: "Disqualifié – tarif social", tone: "danger" },
  NOT_INTERESTED: { label: "Pas intéressé", tone: "neutral" },
  INCOMPLETE_DOSSIER: { label: "Dossier incomplet", tone: "warning" },
  CALLBACK_REQUESTED: { label: "Rappel demandé", tone: "orange" },
  UNDETERMINED: { label: "Indéterminé", tone: "neutral" },
};

export const DOSSIER_STATUS_META: Record<DossierStatus, { label: string }> = {
  NOUVEAU_DOSSIER: { label: "Nouveau dossier" },
  A_VERIFIER: { label: "À vérifier" },
  A_RAPPELER: { label: "À rappeler" },
  PRET_POUR_CLOSING: { label: "Prêt pour closing" },
  CONTRAT_ENVOYE: { label: "Contrat envoyé" },
  SIGNE: { label: "Signé" },
  PERDU: { label: "Perdu" },
};

export const DOSSIER_PIPELINE_ORDER: DossierStatus[] = [
  "NOUVEAU_DOSSIER",
  "A_VERIFIER",
  "A_RAPPELER",
  "PRET_POUR_CLOSING",
  "CONTRAT_ENVOYE",
  "SIGNE",
  "PERDU",
];

export const TONE_BADGE_CLASSES: Record<string, string> = {
  neutral: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  orange: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900",
  danger: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
};
