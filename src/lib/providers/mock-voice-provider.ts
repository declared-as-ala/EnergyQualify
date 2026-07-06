import type {
  CallStatusResult,
  CreateCallParams,
  CreateCallResult,
  ParsedWebhookPayload,
  VoiceProvider,
} from "./voice-provider";
import type { TranscriptTurn } from "@/lib/types";

/**
 * Demo-mode provider. Never places a real call — used so the whole pilot
 * platform can be exercised end-to-end without Vapi/Twilio credentials.
 */
export class MockVoiceProvider implements VoiceProvider {
  readonly id = "MOCK" as const;

  private calls = new Map<string, { contactId: string; startedAt: number }>();

  async createCall(params: CreateCallParams): Promise<CreateCallResult> {
    const externalCallId = `mock-call-${Math.random().toString(36).slice(2, 10)}`;
    this.calls.set(externalCallId, { contactId: params.contact.id, startedAt: Date.now() });
    return { externalCallId, status: "queued" };
  }

  async getCallStatus(externalCallId: string): Promise<CallStatusResult> {
    const entry = this.calls.get(externalCallId);
    if (!entry) return { status: "failed" };
    const elapsed = Date.now() - entry.startedAt;
    if (elapsed < 1500) return { status: "ringing" };
    if (elapsed < 4000) return { status: "in_progress" };
    return { status: "completed", durationSec: Math.round(elapsed / 1000) };
  }

  async getTranscript(): Promise<TranscriptTurn[]> {
    return [];
  }

  async parseWebhook(rawBody: unknown): Promise<ParsedWebhookPayload> {
    const body = rawBody as Partial<ParsedWebhookPayload>;
    return {
      externalCallId: body.externalCallId ?? "unknown",
      contactId: body.contactId ?? "unknown",
      status: body.status ?? "completed",
      transcript: body.transcript,
      summary: body.summary,
      qualificationResult: body.qualificationResult,
      extractedData: body.extractedData,
      recordingUrl: body.recordingUrl,
      aiConfidence: body.aiConfidence,
    };
  }
}

export const mockVoiceProvider = new MockVoiceProvider();
