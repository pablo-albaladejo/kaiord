/**
 * createDexieUsageTelemetrySink — an `AiTelemetrySink` that folds each
 * `run_finished` event's provider-reported usage, and each chat turn's
 * (`chat_turn_finished`, whatever its status — a stopped or paused turn was
 * billed too), into the `usageEvents` log via the shared `appendUsageEvent`
 * writer. Persisting is best-effort and fire-and-forget: `emit` is synchronous
 * and MUST NOT block or fail the model run, so the async write's rejection is
 * swallowed (logged). `run_failed` and events without usage are ignored.
 * Redaction stays by construction — only ids and metrics cross this boundary.
 */
import type {
  AiTelemetryEvent,
  AiTelemetrySink,
} from "@kaiord/ai/observability";
import type { Logger } from "@kaiord/core";

import {
  appendUsageEvent,
  type AppendUsageEventInput,
} from "../../application/usage/append-usage-event";
import { providerTypeFromSdk } from "../../application/usage/provider-type-from-sdk";
import type { PersistencePort } from "../../ports/persistence-port";

const WRITE_FAILED = "Usage telemetry event write failed";
const UNMAPPED_PROVIDER = "Usage telemetry provider not mapped to a rate type";

type UsageFields = Omit<AppendUsageEventInput, "providerType">;

const usageOf = (event: AiTelemetryEvent): UsageFields | undefined => {
  if (event.type === "chat_turn_finished")
    return {
      purpose: "chat",
      modelId: event.modelId,
      traceId: event.traceId,
      promptTokens: event.inputTokens,
      completionTokens: event.outputTokens,
    };
  if (event.type !== "run_finished" || !event.usage) return undefined;
  return {
    purpose: event.purpose,
    modelId: event.modelId,
    traceId: event.traceId,
    promptTokens: event.usage.promptTokens,
    completionTokens: event.usage.completionTokens,
  };
};

export const createDexieUsageTelemetrySink = (
  persistence: PersistencePort,
  logger?: Logger
): AiTelemetrySink => ({
  emit: (event: AiTelemetryEvent) => {
    const usage = usageOf(event);
    if (!usage) return;
    const providerType = providerTypeFromSdk(event.provider);
    if (!providerType)
      logger?.warn(UNMAPPED_PROVIDER, { provider: event.provider });

    void appendUsageEvent(persistence, { ...usage, providerType }).catch(
      (error) => logger?.warn(WRITE_FAILED, { error })
    );
  },
});
