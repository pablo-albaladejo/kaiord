/**
 * useBatchCostEstimate — compute token + cost estimates for a pending
 * batch of RAW workouts against a configured LLM provider. Thin React
 * adapter over the pure `estimateTokenSplit` heuristic, priced with
 * `priceRun` at the input and output prices of the model the batch runs
 * on (`modelId`, resolved for workout generation), else the provider's.
 *
 * `costUsd` is null when no provider is configured, and also when the
 * model has no price; `priceUnknown` tells the second case apart so the
 * dialog says the price is unknown instead of showing nothing.
 */

import { modelForProvider, priceRun } from "@kaiord/ai/providers";
import { useMemo } from "react";

import { estimateTokenSplit } from "../application/cost-estimation";
import type { LlmProviderConfig } from "../store/ai-store-types";
import type { WorkoutRecord } from "../types/calendar-record";

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
    const split = estimateTokenSplit(workouts);
    const tokens = split.input + split.output;
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
      requests: [
        {
          outcome: "ok",
          usage: { promptTokens: split.input, completionTokens: split.output },
        },
      ],
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
