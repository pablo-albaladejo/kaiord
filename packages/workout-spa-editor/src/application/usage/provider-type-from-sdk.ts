/**
 * Map an AI SDK provider string (OTel `gen_ai.system`, e.g. `anthropic.messages`)
 * to the SPA's `LlmProviderType` so a telemetry event can be priced with the
 * same rate table the legacy chat writer uses. Returns `undefined` for an
 * unrecognized provider; the caller records usage with zero cost rather than
 * dropping the event.
 */
import type { LlmProviderType } from "../../store/ai-store-types";

const PREFIX_TO_TYPE: ReadonlyArray<readonly [string, LlmProviderType]> = [
  ["anthropic", "anthropic"],
  ["openai", "openai"],
  ["azure", "openai"],
  ["google", "google"],
  ["gemini", "google"],
  ["vertex", "google"],
];

export const providerTypeFromSdk = (
  provider: string
): LlmProviderType | undefined => {
  const normalized = provider.toLowerCase();
  const match = PREFIX_TO_TYPE.find(([prefix]) =>
    normalized.startsWith(prefix)
  );
  return match?.[1];
};
