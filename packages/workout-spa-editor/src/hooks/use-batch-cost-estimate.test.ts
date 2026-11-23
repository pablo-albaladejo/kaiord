import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../store/ai-store-types";
import type { WorkoutRecord } from "../types/calendar-record";
import { useBatchCostEstimate } from "./use-batch-cost-estimate";

const DIGITS = 10;
const EXPECTED_TOKENS_ONE_WORKOUT = 501;
const SONNET_5_ESTIMATE_USD = 0.005002;

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
  model: "claude-sonnet-5",
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
      priceUnknown: false,
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

  it("should price the estimate at the model's own input and output prices", () => {
    // Arrange
    const workouts = [makeWorkout("abc")];

    // Act
    const { result } = renderHook(() =>
      useBatchCostEstimate(workouts, anthropic)
    );

    // Assert

    // 1 input token at $2 and 500 output tokens at $10 per 1M
    expect(result.current.tokens).toBe(EXPECTED_TOKENS_ONE_WORKOUT);
    expect(result.current.costUsd).toBeCloseTo(SONNET_5_ESTIMATE_USD, DIGITS);
    expect(result.current.providerLabel).toBe("My Claude");
    expect(result.current.priceUnknown).toBe(false);
  });

  it("should say the price is unknown, not zero, for a model with no price", () => {
    // Arrange
    const workouts = [makeWorkout("abc")];
    const openai: LlmProviderConfig = {
      ...anthropic,
      type: "openai",
      model: "o1",
    };

    // Act
    const { result } = renderHook(() => useBatchCostEstimate(workouts, openai));

    // Assert
    expect(result.current.costUsd).toBeNull();
    expect(result.current.priceUnknown).toBe(true);
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
