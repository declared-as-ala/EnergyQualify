import { mockVoiceProvider } from "./mock-voice-provider";
import { VapiVoiceProvider } from "./vapi-voice-provider";
import type { VoiceProvider } from "./voice-provider";
import type { VoiceProviderType } from "@/lib/types";

export * from "./voice-provider";

export function getVoiceProvider(type: VoiceProviderType = "MOCK"): VoiceProvider {
  switch (type) {
    case "VAPI":
      return new VapiVoiceProvider();
    case "TWILIO":
      throw new Error("TwilioVoiceProvider not implemented yet — use MOCK or VAPI.");
    case "MOCK":
    default:
      return mockVoiceProvider;
  }
}
