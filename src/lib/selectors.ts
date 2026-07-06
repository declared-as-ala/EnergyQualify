import type { Call, Callback, Campaign, Contact, ContactStatus, QualifiedDossier } from "@/lib/types";

export function getContactsForCampaign(contacts: Contact[], campaignId: string): Contact[] {
  return contacts.filter((c) => c.campaignId === campaignId);
}

export function countByStatus(contacts: Contact[]): Record<ContactStatus, number> {
  const base: Record<ContactStatus, number> = {
    IMPORTED: 0,
    READY_TO_CALL: 0,
    CALLING: 0,
    NO_ANSWER: 0,
    CALLBACK_REQUESTED: 0,
    NOT_INTERESTED: 0,
    DISQUALIFIED_BRUSSELS: 0,
    DISQUALIFIED_SOCIAL_TARIFF: 0,
    INTERESTED_INCOMPLETE_DOSSIER: 0,
    QUALIFIED_DOSSIER: 0,
    DO_NOT_CONTACT: 0,
    FAILED_CALL: 0,
  };
  for (const c of contacts) base[c.status]++;
  return base;
}

const CALLED_STATUSES: ContactStatus[] = [
  "CALLING",
  "NO_ANSWER",
  "CALLBACK_REQUESTED",
  "NOT_INTERESTED",
  "DISQUALIFIED_BRUSSELS",
  "DISQUALIFIED_SOCIAL_TARIFF",
  "INTERESTED_INCOMPLETE_DOSSIER",
  "QUALIFIED_DOSSIER",
  "FAILED_CALL",
];

const ANSWERED_STATUSES: ContactStatus[] = [
  "CALLBACK_REQUESTED",
  "NOT_INTERESTED",
  "DISQUALIFIED_BRUSSELS",
  "DISQUALIFIED_SOCIAL_TARIFF",
  "INTERESTED_INCOMPLETE_DOSSIER",
  "QUALIFIED_DOSSIER",
];

const INTERESTED_STATUSES: ContactStatus[] = [
  "CALLBACK_REQUESTED",
  "INTERESTED_INCOMPLETE_DOSSIER",
  "QUALIFIED_DOSSIER",
];

export interface FunnelStats {
  imported: number;
  called: number;
  answered: number;
  interested: number;
  qualified: number;
}

export function computeFunnel(contacts: Contact[]): FunnelStats {
  return {
    imported: contacts.length,
    called: contacts.filter((c) => CALLED_STATUSES.includes(c.status)).length,
    answered: contacts.filter((c) => ANSWERED_STATUSES.includes(c.status)).length,
    interested: contacts.filter((c) => INTERESTED_STATUSES.includes(c.status)).length,
    qualified: contacts.filter((c) => c.status === "QUALIFIED_DOSSIER").length,
  };
}

export function qualificationRate(contacts: Contact[]): number {
  const called = contacts.filter((c) => CALLED_STATUSES.includes(c.status)).length;
  const qualified = contacts.filter((c) => c.status === "QUALIFIED_DOSSIER").length;
  if (called === 0) return 0;
  return Math.round((qualified / called) * 1000) / 10;
}

export function callbackRate(contacts: Contact[]): number {
  const called = contacts.filter((c) => CALLED_STATUSES.includes(c.status)).length;
  const cb = contacts.filter((c) => c.status === "CALLBACK_REQUESTED").length;
  if (called === 0) return 0;
  return Math.round((cb / called) * 1000) / 10;
}

export function answerRate(contacts: Contact[]): number {
  const called = contacts.filter((c) => CALLED_STATUSES.includes(c.status)).length;
  const answered = contacts.filter((c) => ANSWERED_STATUSES.includes(c.status)).length;
  if (called === 0) return 0;
  return Math.round((answered / called) * 1000) / 10;
}

export function campaignProgress(campaign: Campaign, contacts: Contact[]): number {
  const assigned = getContactsForCampaign(contacts, campaign.id);
  if (assigned.length === 0) return 0;
  const called = assigned.filter((c) => CALLED_STATUSES.includes(c.status)).length;
  return Math.round((called / assigned.length) * 100);
}

export function upcomingCallbacks(callbacks: Callback[], nowIso: string, limit = 5) {
  return [...callbacks]
    .filter((cb) => !cb.done)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, limit);
}

export function recentCalls(calls: Call[], limit = 8) {
  return [...calls].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, limit);
}

export function recentDossiers(dossiers: QualifiedDossier[], limit = 5) {
  return [...dossiers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}

export function contactById(contacts: Contact[], id: string | undefined) {
  return contacts.find((c) => c.id === id);
}

export function campaignById(campaigns: Campaign[], id: string | undefined) {
  return campaigns.find((c) => c.id === id);
}
