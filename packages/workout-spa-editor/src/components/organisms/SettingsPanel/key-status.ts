import type { LlmProviderConfig } from "../../../store/ai-store-types";

export type KeyStatus = "verified" | "unverified" | "missing";

/** A key the provider accepted, one never checked, or none at all. */
export const keyStatusOf = (
  provider: Pick<LlmProviderConfig, "apiKeyMissing" | "keyCheck">
): KeyStatus => {
  if (provider.apiKeyMissing) return "missing";
  return provider.keyCheck === "valid" ? "verified" : "unverified";
};
