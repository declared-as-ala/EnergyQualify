import type {
  CallStatusResult,
  CreateCallParams,
  CreateCallResult,
  ParsedWebhookPayload,
  VoiceProvider,
} from "./voice-provider";
import type { TranscriptTurn } from "@/lib/types";

/**
 * Skeleton for a real Vapi integration. Not wired up — fill in the TODOs
 * and set VAPI_API_KEY / VAPI_PHONE_NUMBER_ID once the pilot moves past
 * demo mode. Never imported unless NEXT_PUBLIC_DEMO_MODE=false.
 */
export class VapiVoiceProvider implements VoiceProvider {
  readonly id = "VAPI" as const;

  constructor(
    private readonly apiKey: string = process.env.VAPI_API_KEY ?? "",
    private readonly phoneNumberId: string = process.env.VAPI_PHONE_NUMBER_ID ?? "",
  ) {}

  async createCall(params: CreateCallParams): Promise<CreateCallResult> {
    // TODO: POST https://api.vapi.ai/call with { phoneNumberId, customer: { number: params.contact.phone }, assistantId }
    // TODO: map campaign.rules / agentConfig into a Vapi assistant config (or reference a pre-created assistantId)
    throw new Error(
      `VapiVoiceProvider.createCall not implemented — configure VAPI_API_KEY/VAPI_PHONE_NUMBER_ID (contact=${params.contact.id}, phoneNumberId=${this.phoneNumberId})`,
    );
  }

  async getCallStatus(externalCallId: string): Promise<CallStatusResult> {
    // TODO: GET https://api.vapi.ai/call/{externalCallId} and map `status`/`endedReason` to CallStatusResult
    throw new Error(`VapiVoiceProvider.getCallStatus not implemented (callId=${externalCallId})`);
  }

  async getTranscript(externalCallId: string): Promise<TranscriptTurn[]> {
    // TODO: GET call details, map `messages`/`transcript` to TranscriptTurn[]
    throw new Error(`VapiVoiceProvider.getTranscript not implemented (callId=${externalCallId})`);
  }

  async parseWebhook(rawBody: unknown, headers: Record<string, string>): Promise<ParsedWebhookPayload> {
    // TODO: verify `x-vapi-signature` header against VOICE_WEBHOOK_SECRET before trusting the payload
    // TODO: map Vapi's `end-of-call-report` message shape (call.id, transcript, analysis.structuredData, ...)
    void headers;
    throw new Error(`VapiVoiceProvider.parseWebhook not implemented (payload=${JSON.stringify(rawBody).slice(0, 120)})`);
  }
}
