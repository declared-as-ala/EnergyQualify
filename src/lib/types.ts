// Shared domain types for EnergyQualify AI.
// Mirrors prisma/schema.prisma enums/models so the mock data layer and the
// UI share a single source of truth without requiring a live database.

export type UserRole = "ADMIN" | "CAMPAIGN_MANAGER" | "CLOSER" | "VIEWER";

export type CampaignStatus =
  | "DRAFT"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED";

export type ContactStatus =
  | "IMPORTED"
  | "READY_TO_CALL"
  | "CALLING"
  | "NO_ANSWER"
  | "CALLBACK_REQUESTED"
  | "NOT_INTERESTED"
  | "DISQUALIFIED_BRUSSELS"
  | "DISQUALIFIED_SOCIAL_TARIFF"
  | "INTERESTED_INCOMPLETE_DOSSIER"
  | "QUALIFIED_DOSSIER"
  | "DO_NOT_CONTACT"
  | "FAILED_CALL";

export type CallStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NO_ANSWER"
  | "FAILED"
  | "VOICEMAIL";

export type QualificationResult =
  | "QUALIFIED"
  | "DISQUALIFIED_BRUSSELS"
  | "DISQUALIFIED_SOCIAL_TARIFF"
  | "NOT_INTERESTED"
  | "INCOMPLETE_DOSSIER"
  | "CALLBACK_REQUESTED"
  | "UNDETERMINED";

export type DossierStatus =
  | "NOUVEAU_DOSSIER"
  | "A_VERIFIER"
  | "A_RAPPELER"
  | "PRET_POUR_CLOSING"
  | "CONTRAT_ENVOYE"
  | "SIGNE"
  | "PERDU";

export type VoiceProviderType = "MOCK" | "VAPI" | "TWILIO";

export type InterestLevel = "INCONNU" | "FAIBLE" | "MOYEN" | "ELEVE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Contact {
  id: string;
  civility?: string;
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  ageRange?: string;
  email?: string;
  dateOfBirth?: string;
  eanCode?: string;
  supplier?: string;
  status: ContactStatus;
  interestLevel: InterestLevel;
  score: number;
  isDuplicate: boolean;
  isBrusselsGuess: boolean;
  campaignId?: string;
  importId?: string;
  notes?: string;
  lastActivityAt?: string;
  createdAt: string;
}

export interface CampaignChecklist {
  contactListReviewed: boolean;
  doNotContactApplied: boolean;
  callHoursConfigured: boolean;
  scriptReviewed: boolean;
  dataFieldsApproved: boolean;
  pilotScopeConfirmed: boolean;
}

export interface QualificationRules {
  excludeBrussels: boolean;
  excludeSocialTariff: boolean;
  requireInterest: boolean;
  requiredFields: string[];
}

export interface Campaign {
  id: string;
  name: string;
  offer: string;
  targetSegment: string;
  status: CampaignStatus;
  voiceProvider: VoiceProviderType;
  callHoursStart: string;
  callHoursEnd: string;
  callDaysOfWeek: number[];
  pilotSize: number;
  rules: QualificationRules;
  checklist: CampaignChecklist;
  createdAt: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
}

export interface Call {
  id: string;
  contactId: string;
  campaignId: string;
  provider: VoiceProviderType;
  status: CallStatus;
  startedAt: string;
  endedAt?: string;
  durationSec?: number;
  transcript?: TranscriptTurn[];
  summary?: string;
  aiConfidence?: number;
  detectedObjections: string[];
  assignedCloserId?: string;
  qualificationResult: QualificationResult;
}

export interface TranscriptTurn {
  speaker: "agent" | "contact";
  text: string;
  timestamp: string;
}

export interface QualifiedDossier {
  id: string;
  contactId: string;
  campaignId: string;
  callId?: string;
  status: DossierStatus;
  completenessPercent: number;
  assignedCloserId?: string;
  callSummary?: string;
  internalNote?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: { status: DossierStatus; at: string; note?: string }[];
}

export interface Callback {
  id: string;
  contactId: string;
  campaignId: string;
  scheduledAt: string;
  reason?: string;
  done: boolean;
}

export interface DoNotContactRecord {
  id: string;
  contactId: string;
  reason: string;
  createdAt: string;
  createdBy?: string;
}

export interface ConsentRecord {
  contactId: string;
  consentGiven: boolean;
  consentText: string;
  collectedAt: string;
  channel: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AgentConfiguration {
  id: string;
  name: string;
  language: string;
  speakingStyle: string;
  openingMessage: string;
  objectionHandling: { objection: string; response: string; action: string }[];
  requiredFields: string[];
  escalationRules: string[];
  complianceNotice: string;
  demoMode: boolean;
}

export interface ContactImportSummary {
  id: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  missingPhone: number;
  brusselsRows: number;
  invalidRows: number;
  createdAt: string;
}
