/**
 * createDexieUsageTelemetrySink — an `AiTelemetrySink` that records every
 * run's requests in the `usageEvents` log via the shared `appendUsageEvent`
 * writer: a finished run, a failed run (its attempts were billed too) and a
 * chat turn, whatever its status. Persisting is best-effort and
 * fire-and-forget: `emit` is synchronous and MUST NOT block or fail the model
 * run, so the async write's rejection is swallowed (logged). Redaction stays
 * by construction — only ids and metrics cross this boundary.
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
const UNMAPPED_PROVIDER =
  "Usage telemetry provider not mapped to a provider type";

type UsageFields = Omit<AppendUsageEventInput, "providerType">;

const usageOf = (event: AiTelemetryEvent): UsageFields => ({
  purpose: event.type === "chat_turn_finished" ? "chat" : event.purpose,
  modelId: event.modelId,
  traceId: event.traceId,
  requests: event.requests,
});

export const createDexieUsageTelemetrySink = (
  persistence: PersistencePort,
  logger?: Logger
): AiTelemetrySink => ({
  emit: (event: AiTelemetryEvent) => {
    const usage = usageOf(event);
    if (usage.requests.length === 0) return;
    const providerType = providerTypeFromSdk(event.provider);
    if (!providerType)
      logger?.warn(UNMAPPED_PROVIDER, { provider: event.provider });

    void appendUsageEvent(persistence, { ...usage, providerType }).catch(
      (error) => logger?.warn(WRITE_FAILED, { error })
    );
  },
});
