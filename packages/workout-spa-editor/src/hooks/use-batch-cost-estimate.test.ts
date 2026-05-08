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
    // Arrange

    // Act
    const { result } = renderHook(() => useBatchCostEstimate([], null));

    // Assert
    expect(result.current).toEqual({
      tokens: 0,
      costUsd: null,
      providerLabel: null,
    });
  });

  it("should compute tokens for raw workouts using the chars/3 heuristic", () => {
    // Arrange
    const workouts = [makeWorkout("abc"), makeWorkout("def")];

    // Act
    const { result } = renderHook(() => useBatchCostEstimate(workouts, null));

    // Assert
    // eslint-disable-next-line no-magic-numbers -- expected token count from chars/3 heuristic over two 'abc'/'def' fixtures
    expect(result.current.tokens).toBe(1002);
    expect(result.current.costUsd).toBeNull();
    expect(result.current.providerLabel).toBeNull();
  });

  it("should compute cost via the blended anthropic rate when a provider is given", () => {
    // Arrange
    const workouts = [makeWorkout("abc")];

    // Act
    const { result } = renderHook(() =>
      useBatchCostEstimate(workouts, anthropic)
    );

    // Assert
    // eslint-disable-next-line no-magic-numbers -- expected token count from chars/3 heuristic over single 'abc' fixture
    expect(result.current.tokens).toBe(501);
    // eslint-disable-next-line no-magic-numbers -- blended anthropic billing: 501 tokens * $3 input rate / 1_000_000 (per-million pricing denominator); rounded to 6 decimals
    expect(result.current.costUsd).toBeCloseTo((501 * 3) / 1_000_000, 6);
    expect(result.current.providerLabel).toBe("My Claude");
  });

  it("should cache the result when inputs are referentially stable", () => {
    // Arrange
    const workouts = [makeWorkout("abc")];
    const { result, rerender } = renderHook(
      ({ w, p }: { w: WorkoutRecord[]; p: LlmProviderConfig | null }) =>
        useBatchCostEstimate(w, p),
      { initialProps: { w: workouts, p: anthropic } }
    );
    const first = result.current;

    // Act
    rerender({ w: workouts, p: anthropic });

    // Assert
    expect(result.current).toBe(first);
  });
});
