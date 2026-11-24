/**
 * appendUsageEvent — the single writer of this device's `usageEvents` log, shared
 * by the Dexie telemetry sink (generation/batch/lab runs and chat turns). It
 * prices the run's requests with `priceRun` at the model's own prices, failed
 * attempts included, and skips a run that made no request. A model or
 * Provider with no price records its usage with `costBasis: "unknown"`.
 * Ids/timestamps are injected for deterministic tests.
 */
import type { AiRequest } from "@kaiord/ai/observability";
import {
  type LlmProviderType,
  priceRun,
  type RunCost,
} from "@kaiord/ai/providers";

import type { PersistencePort } from "../../ports/persistence-port";
import type { AiModelPurpose } from "../../types/ai-model-binding";
import { usageEventSchema } from "../../types/usage-event-schemas";

export type AppendUsageEventInput = {
  purpose: AiModelPurpose;
  providerType?: LlmProviderType;
  modelId: string;
  requests: readonly AiRequest[];
};

const costFieldsOf = (cost: RunCost) => ({
  promptTokens: cost.usage.promptTokens,
  completionTokens: cost.usage.completionTokens,
  tokens: cost.usage.promptTokens + cost.usage.completionTokens,
  ...(cost.usage.cacheReadTokens > 0
    ? { cacheReadTokens: cost.usage.cacheReadTokens }
    : {}),
  ...(cost.usage.cacheWriteTokens > 0
    ? { cacheWriteTokens: cost.usage.cacheWriteTokens }
    : {}),
  ...(cost.usd === null ? {} : { cost: cost.usd }),
  costBasis: cost.basis.kind,
  ...(cost.basis.kind === "price_table"
    ? { priceReadOn: cost.basis.readOn }
    : {}),
  requestCount: cost.requests.length,
  failedRequests: cost.failedRequests,
  unmeasuredRequests: cost.unmeasuredRequests,
  estimatedRequests: cost.estimatedRequests,
});

export const appendUsageEvent = async (
  persistence: PersistencePort,
  input: AppendUsageEventInput,
  now: () => Date = () => new Date(),
  newId: () => string = () => crypto.randomUUID()
): Promise<void> => {
  if (input.requests.length === 0) return;
  const at = now();
  const iso = at.toISOString();
  const cost = priceRun({
    provider: input.providerType,
    modelId: input.modelId,
    requests: input.requests,
    at,
  });

  // Parse at the single write boundary: `.strict()` rejects any stray field, so
  // the redaction guarantee (ids and metrics only) is enforced at runtime, not
  // by the TypeScript type alone.
  const record = usageEventSchema.parse({
    id: newId(),
    yearMonth: iso.slice(0, 7),
    date: iso.slice(0, 10),
    purpose: input.purpose,
    ...(input.providerType !== undefined
      ? { providerType: input.providerType }
      : {}),
    modelId: input.modelId,
    ...costFieldsOf(cost),
    createdAt: iso,
  });
  await persistence.usageEvents.append(record);
};
