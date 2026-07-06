// Voice provider abstraction. Every real integration (Vapi, Twilio, ...)
// implements this interface so the rest of the app never depends on a
// specific vendor SDK. In demo mode, MockVoiceProvider is used and never
// places a real call.

import type { Call, Campaign, Contact, QualificationResult, TranscriptTurn } from "@/lib/types";

export interface CreateCallParams {
  contact: Contact;
  campaign: Campaign;
}

export interface CreateCallResult {
  externalCallId: string;
  status: "queued" | "ringing" | "in_progress";
}

export interface CallStatusResult {
  status: "queued" | "ringing" | "in_progress" | "completed" | "no_answer" | "failed" | "voicemail";
  durationSec?: number;
}

export interface ParsedWebhookPayload {
  externalCallId: string;
  contactId: string;
  status: CallStatusResult["status"];
  transcript?: TranscriptTurn[];
  summary?: string;
  qualificationResult?: QualificationResult;
  extractedData?: Partial<
    Pick<Contact, "email" | "dateOfBirth" | "eanCode" | "supplier" | "interestLevel">
  >;
  recordingUrl?: string;
  aiConfidence?: number;
}

export interface VoiceProvider {
  readonly id: "MOCK" | "VAPI" | "TWILIO";
  createCall(params: CreateCallParams): Promise<CreateCallResult>;
  getCallStatus(externalCallId: string): Promise<CallStatusResult>;
  getTranscript(externalCallId: string): Promise<TranscriptTurn[]>;
  /** Verifies signature (when applicable) and normalizes a provider webhook body. */
  parseWebhook(rawBody: unknown, headers: Record<string, string>): Promise<ParsedWebhookPayload>;
}

export type { Call };
