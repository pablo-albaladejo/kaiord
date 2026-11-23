/**
 * useBatchCostEstimate — compute token + cost estimates for a pending
 * batch of RAW workouts against a configured LLM provider. Thin React
 * adapter over the pure `estimateWorkoutRequests` heuristic: one request
 * per workout, each carrying the workout-parser system prompt, priced with
 * `priceRun` request by request at the prices of the model the batch runs
 * on (`modelId`, resolved for workout generation), else the provider's. A
 * long-context tier then applies only to a workout whose own request
 * crosses it, as the Provider bills it.
 *
 * `costUsd` is null when no provider is configured, and also when the
 * model has no price; `priceUnknown` tells the second case apart so the
 * dialog says the price is unknown instead of showing nothing.
 */

import { WORKOUT_PARSER_SYSTEM } from "@kaiord/ai/prompts";
import { modelForProvider, priceRun } from "@kaiord/ai/providers";
import { useMemo } from "react";

import { estimateWorkoutRequests } from "../application/cost-estimation";
import type { LlmProviderConfig } from "../store/ai-store-types";
import type { WorkoutRecord } from "../types/calendar-record";

const SYSTEM_CHARS = WORKOUT_PARSER_SYSTEM.template.length;

export type BatchCostEstimate = {
  tokens: number;
  costUsd: number | null;
  providerLabel: string | null;
  priceUnknown: boolean;
};

export function useBatchCostEstimate(
  workouts: WorkoutRecord[],
  provider: LlmProviderConfig | null,
  modelId?: string
): BatchCostEstimate {
  return useMemo(() => {
    const requests = estimateWorkoutRequests(workouts, SYSTEM_CHARS);
    const tokens = requests.reduce((n, r) => n + r.input + r.output, 0);
    if (!provider) {
      return {
        tokens,
        costUsd: null,
        providerLabel: null,
        priceUnknown: false,
      };
    }
    const { usd } = priceRun({
      provider: provider.type,
      modelId: modelId ?? modelForProvider(provider),
      requests: requests.map((r) => ({
        outcome: "ok" as const,
        usage: { promptTokens: r.input, completionTokens: r.output },
      })),
      at: new Date(),
    });
    return {
      tokens,
      costUsd: usd,
      providerLabel: provider.label,
      priceUnknown: usd === null,
    };
  }, [workouts, provider, modelId]);
}
