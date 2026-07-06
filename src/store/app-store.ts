"use client";

import { create } from "zustand";
import { generateMockDataset } from "@/lib/mock/generate";
import { NOW } from "@/lib/mock/constants";
import type {
  AuditLogEntry,
  Callback,
  Campaign,
  CampaignStatus,
  Contact,
  ContactImportSummary,
  ContactStatus,
  DossierStatus,
  QualifiedDossier,
} from "@/lib/types";

const initial = generateMockDataset();

interface AppState {
  demoMode: boolean;
  now: string;
  users: typeof initial.users;
  campaigns: Campaign[];
  contacts: Contact[];
  calls: typeof initial.calls;
  dossiers: QualifiedDossier[];
  callbacks: Callback[];
  doNotContact: typeof initial.doNotContact;
  auditLog: AuditLogEntry[];
  agentConfig: typeof initial.agentConfig;
  imports: ContactImportSummary[];

  setDemoMode: (v: boolean) => void;
  logAction: (action: string, entityType: string, userName: string, entityId?: string, metadata?: Record<string, unknown>) => void;

  setCampaignStatus: (id: string, status: CampaignStatus) => void;
  updateChecklist: (id: string, patch: Partial<Campaign["checklist"]>) => void;
  createCampaign: (campaign: Campaign) => void;

  updateContactStatus: (contactId: string, status: ContactStatus) => void;
  assignContactsToCampaign: (contactIds: string[], campaignId: string) => void;
  markDoNotContact: (contactIds: string[], reason: string) => void;
  scheduleCallback: (contactId: string, campaignId: string, scheduledAt: string, reason?: string) => void;

  setDossierStatus: (dossierId: string, status: DossierStatus, note?: string) => void;

  importContacts: (summary: ContactImportSummary, contacts: Contact[]) => void;
  updateContactNotes: (contactId: string, notes: string) => void;
  updateAgentConfig: (patch: Partial<typeof initial.agentConfig>) => void;
  convertCallToDossier: (callId: string, closerId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  demoMode: true,
  now: NOW.toISOString(),
  users: initial.users,
  campaigns: initial.campaigns,
  contacts: initial.contacts,
  calls: initial.calls,
  dossiers: initial.dossiers,
  callbacks: initial.callbacks,
  doNotContact: initial.doNotContact,
  auditLog: initial.auditLog,
  agentConfig: initial.agentConfig,
  imports: initial.imports,

  setDemoMode: (v) => set({ demoMode: v }),

  logAction: (action, entityType, userName, entityId, metadata) =>
    set((s) => ({
      auditLog: [
        {
          id: `audit-${s.auditLog.length + 1}-${Date.now()}`,
          action,
          entityType,
          entityId,
          userName,
          metadata,
          createdAt: new Date().toISOString(),
        },
        ...s.auditLog,
      ],
    })),

  setCampaignStatus: (id, status) => {
    set((s) => ({
      campaigns: s.campaigns.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              startedAt: status === "RUNNING" && !c.startedAt ? new Date().toISOString() : c.startedAt,
              pausedAt: status === "PAUSED" ? new Date().toISOString() : c.pausedAt,
              completedAt: status === "COMPLETED" ? new Date().toISOString() : c.completedAt,
            }
          : c,
      ),
    }));
    get().logAction(`campaign.${status.toLowerCase()}`, "Campaign", "Simon Lefèvre", id);
  },

  updateChecklist: (id, patch) =>
    set((s) => ({
      campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, checklist: { ...c.checklist, ...patch } } : c)),
    })),

  createCampaign: (campaign) => {
    set((s) => ({ campaigns: [campaign, ...s.campaigns] }));
    get().logAction("campaign.created", "Campaign", "Simon Lefèvre", campaign.id, { name: campaign.name });
  },

  updateContactStatus: (contactId, status) =>
    set((s) => ({
      contacts: s.contacts.map((c) => (c.id === contactId ? { ...c, status, lastActivityAt: new Date().toISOString() } : c)),
    })),

  assignContactsToCampaign: (contactIds, campaignId) => {
    set((s) => ({
      contacts: s.contacts.map((c) =>
        contactIds.includes(c.id) ? { ...c, campaignId, status: c.status === "IMPORTED" ? "READY_TO_CALL" : c.status } : c,
      ),
    }));
    get().logAction("contacts.assigned_to_campaign", "Contact", "Simon Lefèvre", campaignId, { count: contactIds.length });
  },

  markDoNotContact: (contactIds, reason) => {
    set((s) => ({
      contacts: s.contacts.map((c) => (contactIds.includes(c.id) ? { ...c, status: "DO_NOT_CONTACT" } : c)),
      doNotContact: [
        ...contactIds.map((id, i) => ({
          id: `dnc-${s.doNotContact.length + i + 1}-${Date.now()}`,
          contactId: id,
          reason,
          createdAt: new Date().toISOString(),
          createdBy: "Simon Lefèvre",
        })),
        ...s.doNotContact,
      ],
    }));
    get().logAction("contact.marked_do_not_contact", "Contact", "Simon Lefèvre", undefined, { count: contactIds.length, reason });
  },

  scheduleCallback: (contactId, campaignId, scheduledAt, reason) => {
    set((s) => ({
      callbacks: [
        {
          id: `callback-${s.callbacks.length + 1}-${Date.now()}`,
          contactId,
          campaignId,
          scheduledAt,
          reason,
          done: false,
        },
        ...s.callbacks,
      ],
      contacts: s.contacts.map((c) => (c.id === contactId ? { ...c, status: "CALLBACK_REQUESTED" } : c)),
    }));
    get().logAction("callback.scheduled", "Contact", "Simon Lefèvre", contactId, { scheduledAt });
  },

  setDossierStatus: (dossierId, status, note) => {
    set((s) => ({
      dossiers: s.dossiers.map((d) =>
        d.id === dossierId
          ? {
              ...d,
              status,
              updatedAt: new Date().toISOString(),
              statusHistory: [...d.statusHistory, { status, at: new Date().toISOString(), note }],
            }
          : d,
      ),
    }));
    get().logAction("dossier.status_changed", "QualifiedDossier", "Simon Lefèvre", dossierId, { status });
  },

  importContacts: (summary, contacts) => {
    set((s) => ({
      imports: [summary, ...s.imports],
      contacts: [...contacts, ...s.contacts],
    }));
    get().logAction("import.completed", "ContactImport", "Simon Lefèvre", summary.id, {
      fileName: summary.fileName,
      validRows: summary.validRows,
    });
  },

  updateContactNotes: (contactId, notes) =>
    set((s) => ({
      contacts: s.contacts.map((c) => (c.id === contactId ? { ...c, notes } : c)),
    })),

  updateAgentConfig: (patch) =>
    set((s) => ({
      agentConfig: { ...s.agentConfig, ...patch },
    })),

  convertCallToDossier: (callId, closerId) => {
    const call = get().calls.find((c) => c.id === callId);
    if (!call) return;
    const contact = get().contacts.find((c) => c.id === call.contactId);
    if (!contact) return;

    set((s) => ({
      contacts: s.contacts.map((c) => (c.id === contact.id ? { ...c, status: "QUALIFIED_DOSSIER" } : c)),
      dossiers: [
        {
          id: `dossier-converted-${Date.now()}`,
          contactId: contact.id,
          campaignId: call.campaignId,
          callId: call.id,
          status: "NOUVEAU_DOSSIER",
          completenessPercent: 90,
          assignedCloserId: closerId,
          callSummary: call.summary || "Dossier créé manuellement à partir de l'appel.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusHistory: [
            { status: "NOUVEAU_DOSSIER", at: new Date().toISOString(), note: "Validé manuellement par transfert d'appel." }
          ]
        },
        ...s.dossiers,
      ],
      calls: s.calls.map((c) => (c.id === callId ? { ...c, qualificationResult: "QUALIFIED" } : c)),
    }));
    get().logAction("dossier.converted_from_call", "QualifiedDossier", "Simon Lefèvre", call.id);
  },
}));
