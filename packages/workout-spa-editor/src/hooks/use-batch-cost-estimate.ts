/**
 * useBatchCostEstimate — compute token + cost estimates for a pending
 * batch of RAW workouts against a configured LLM provider. Thin React
 * adapter over the pure `estimateTokens` / `estimateCost` helpers plus
 * the per-provider blended rate table.
 *
 * Returns null for `costUsd` if no provider is configured so the
 * caller can render a graceful "no provider selected" state.
 */

import { useMemo } from "react";

import { estimateCost, estimateTokens } from "../application/cost-estimation";
import { getProviderRate } from "../application/provider-rates";
import type { LlmProviderConfig } from "../store/ai-store-types";
import type { WorkoutRecord } from "../types/calendar-record";

export type BatchCostEstimate = {
  tokens: number;
  costUsd: number | null;
  providerLabel: string | null;
};

export function useBatchCostEstimate(
  workouts: WorkoutRecord[],
  provider: LlmProviderConfig | null
): BatchCostEstimate {
  return useMemo(() => {
    const tokens = estimateTokens(workouts);
    if (!provider) {
      return { tokens, costUsd: null, providerLabel: null };
    }
    const ratePerMillion = getProviderRate(provider.type);
    return {
      tokens,
      costUsd: estimateCost(tokens, ratePerMillion),
      providerLabel: provider.label,
    };
  }, [workouts, provider]);
}
