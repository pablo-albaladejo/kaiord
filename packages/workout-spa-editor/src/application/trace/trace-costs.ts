/**
 * A run's cost per model it reached: each model's requests priced together
 * with `priceRun`, failed attempts included. The total is unknown as soon as
 * one model's price is.
 */
import type { AiRequest, AiTelemetryEvent } from "@kaiord/ai/observability";
import { priceRun, type RunCost } from "@kaiord/ai/providers";

import { providerTypeFromSdk } from "../usage/provider-type-from-sdk";

export const costsOf = (
  events: readonly AiTelemetryEvent[],
  at: Date
): RunCost[] => {
  const byModel = new Map<
    string,
    { event: AiTelemetryEvent; requests: AiRequest[] }
  >();
  for (const event of events) {
    const key = `${event.provider}\u0000${event.modelId}`;
    const group = byModel.get(key) ?? { event, requests: [] };
    group.requests.push(...event.requests);
    byModel.set(key, group);
  }
  return [...byModel.values()].map(({ event, requests }) =>
    priceRun({
      provider: providerTypeFromSdk(event.provider),
      modelId: event.modelId,
      requests,
      at,
    })
  );
};

export const totalOf = (costs: readonly RunCost[]): number | null =>
  costs.some((c) => c.usd === null)
    ? null
    : costs.reduce((sum, c) => sum + (c.usd ?? 0), 0);
