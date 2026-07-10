/**
 * appendUsageEvent — the single writer of the `usageEvents` telemetry log,
 * shared by the Dexie telemetry sink (generation/batch/lab runs) and the chat
 * turn writer. Applies the SAME guards as the legacy `recordChatUsage`: skip a
 * zero-token run, and price with `estimateCost(tokens, getProviderRate(type))`.
 * An event without a mappable provider type records usage with zero cost.
 * Ids/timestamps are injected for deterministic tests.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderType } from "../../store/ai-store-types";
import type { AiModelPurpose } from "../../types/ai-model-binding";
import type { UsageEventRecord } from "../../types/usage-event-schemas";
import { estimateCost } from "../cost-estimation";
import { getProviderRate } from "../provider-rates";

export type AppendUsageEventInput = {
  purpose: AiModelPurpose;
  providerType?: LlmProviderType;
  modelId?: string;
  traceId?: string;
  promptTokens: number;
  completionTokens: number;
};

export const appendUsageEvent = async (
  persistence: PersistencePort,
  input: AppendUsageEventInput,
  now: () => Date = () => new Date(),
  newId: () => string = () => crypto.randomUUID()
): Promise<void> => {
  const tokens = input.promptTokens + input.completionTokens;
  if (tokens === 0) return;
  const iso = now().toISOString();
  const cost = input.providerType
    ? estimateCost(tokens, getProviderRate(input.providerType))
    : 0;

  await persistence.usageEvents.append({
    id: newId(),
    ...(input.traceId !== undefined ? { traceId: input.traceId } : {}),
    yearMonth: iso.slice(0, 7),
    date: iso.slice(0, 10),
    purpose: input.purpose,
    ...(input.providerType !== undefined
      ? { providerType: input.providerType }
      : {}),
    ...(input.modelId !== undefined ? { modelId: input.modelId } : {}),
    promptTokens: input.promptTokens,
    completionTokens: input.completionTokens,
    tokens,
    cost,
    createdAt: iso,
  } satisfies UsageEventRecord);
};
