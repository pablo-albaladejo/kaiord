import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../store/ai-store-types";
import type { WorkoutRecord } from "../types/calendar-record";
import { useBatchCostEstimate } from "./use-batch-cost-estimate";

const makeWorkout = (description: string): WorkoutRecord =>
  ({
    id: `w-${description.length}`,
    date: "2026-04-18",
    state: "raw",
    raw: { description, comments: [] },
  }) as unknown as WorkoutRecord;

const anthropic: LlmProviderConfig = {
  id: "p1",
  type: "anthropic",
  apiKey: "k",
  model: "claude",
  label: "My Claude",
  isDefault: true,
  createdAt: 0,
};

describe("useBatchCostEstimate", () => {
  it("should return zero tokens and null cost when no workouts and no provider", () => {
    const { result } = renderHook(() => useBatchCostEstimate([], null));

    expect(result.current).toEqual({
      tokens: 0,
      costUsd: null,
      providerLabel: null,
    });
  });

  it("should compute tokens for raw workouts using the chars/3 heuristic", () => {
    // 3 raw chars + 500 output = 501 tokens per workout (ceil(3/3)=1, +500).
    const workouts = [makeWorkout("abc"), makeWorkout("def")];

    const { result } = renderHook(() => useBatchCostEstimate(workouts, null));

    expect(result.current.tokens).toBe(1002);
    expect(result.current.costUsd).toBeNull();
    expect(result.current.providerLabel).toBeNull();
  });

  it("should compute cost via the blended anthropic rate when a provider is given", () => {
    // 1 workout with 3 chars → 501 tokens. anthropic rate = $3/M → ~$0.001503.
    const workouts = [makeWorkout("abc")];

    const { result } = renderHook(() =>
      useBatchCostEstimate(workouts, anthropic)
    );

    expect(result.current.tokens).toBe(501);
    expect(result.current.costUsd).toBeCloseTo((501 * 3) / 1_000_000, 6);
    expect(result.current.providerLabel).toBe("My Claude");
  });

  it("should cache the result when inputs are referentially stable", () => {
    const workouts = [makeWorkout("abc")];
    const { result, rerender } = renderHook(
      ({ w, p }: { w: WorkoutRecord[]; p: LlmProviderConfig | null }) =>
        useBatchCostEstimate(w, p),
      { initialProps: { w: workouts, p: anthropic } }
    );
    const first = result.current;

    rerender({ w: workouts, p: anthropic });

    expect(result.current).toBe(first);
  });
});
