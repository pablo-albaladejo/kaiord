import type { AiRequest, AiUsage } from "./telemetry-types";

const total = (requests: readonly AiRequest[], field: keyof AiUsage): number =>
  requests.reduce((sum, r) => sum + (r.usage?.[field] ?? 0), 0);

/** Every request's usage summed, estimated requests included. */
export const sumUsage = (
  requests: readonly AiRequest[]
): Required<AiUsage> => ({
  promptTokens: total(requests, "promptTokens"),
  completionTokens: total(requests, "completionTokens"),
  cacheReadTokens: total(requests, "cacheReadTokens"),
  cacheWriteTokens: total(requests, "cacheWriteTokens"),
});

/** The same usage with a cache count only when non-zero. */
export const compactUsage = ({
  cacheReadTokens,
  cacheWriteTokens,
  ...tokens
}: Required<AiUsage>): AiUsage => ({
  ...tokens,
  ...(cacheReadTokens > 0 ? { cacheReadTokens } : {}),
  ...(cacheWriteTokens > 0 ? { cacheWriteTokens } : {}),
});
