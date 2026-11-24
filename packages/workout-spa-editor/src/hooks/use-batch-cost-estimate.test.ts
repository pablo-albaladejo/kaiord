import { WORKOUT_PARSER_SYSTEM } from "@kaiord/ai/prompts";
import { CHARS_PER_TOKEN } from "@kaiord/ai/providers";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LlmProviderConfig } from "../store/ai-store-types";
import type { WorkoutRecord } from "../types/calendar-record";
import { useBatchCostEstimate } from "./use-batch-cost-estimate";

const DIGITS = 10;
const PER_MILLION = 1_000_000;
const OUTPUT_TOKENS = 500;
// USD per 1M tokens, read from the price table's sources by hand.
const SONNET_5 = { input: 2, output: 10 };
const HAIKU_4_5 = { input: 1, output: 5 };
const HAIKU_5_5 = { input: 0.1, output: 0.5 };
const HAIKU_5_5_LONG_CONTEXT = 100_000;
const BATCH_SIZE = 3;
// Every request carries the workout-parser system prompt: 3 characters a
// token, rounded up, with the workout's own text.
const inputTokens = (descriptionChars: number) =>
  Math.ceil(
    (WORKOUT_PARSER_SYSTEM.template.length + descriptionChars) / CHARS_PER_TOKEN
  );
const ABC_INPUT = inputTokens("abc".length);

const makeWorkout = (description: string): WorkoutRecord =>
  ({
    id: `w-${description.slice(0, 1)}-${description.length}`,
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
    expect(result.current.tokens).toBe(
      workouts.length * (ABC_INPUT + OUTPUT_TOKENS)
    );
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
    // Claude Sonnet 5: $2 input and $10 output per 1M tokens
    expect(result.current.tokens).toBe(ABC_INPUT + OUTPUT_TOKENS);
    expect(result.current.costUsd).toBeCloseTo(
      (ABC_INPUT * SONNET_5.input + OUTPUT_TOKENS * SONNET_5.output) /
        PER_MILLION,
      DIGITS
    );
    expect(result.current.providerLabel).toBe("My Claude");
    expect(result.current.priceUnknown).toBe(false);
  });

  it("should price the model the batch runs on, not the provider's own model", () => {
    // Arrange
    const workouts = [makeWorkout("abc")];
    const boundModel = "claude-haiku-4-5";

    // Act
    const { result } = renderHook(() =>
      useBatchCostEstimate(workouts, anthropic, boundModel)
    );

    // Assert
    // Claude Haiku 4.5: $1 input and $5 output per 1M tokens
    expect(result.current.costUsd).toBeCloseTo(
      (ABC_INPUT * HAIKU_4_5.input + OUTPUT_TOKENS * HAIKU_4_5.output) /
        PER_MILLION,
      DIGITS
    );
  });

  it("should price each workout as its own request, so a batch over 100K input tokens stays at Haiku 5.5's base price", () => {
    // Arrange
    // Three workouts of about 44K input tokens each: about 133K together, but
    // no single request crosses Haiku 5.5's 100K long-context threshold.
    const LONG = 120_000;
    const workouts = ["a", "b", "c"].map((c) => makeWorkout(c.repeat(LONG)));
    const perRequest = inputTokens(LONG);

    // Act
    const { result } = renderHook(() =>
      useBatchCostEstimate(workouts, anthropic, "claude-haiku-5-5")
    );

    // Assert
    // Haiku 5.5 base: $0.10 input and $0.50 output per 1M tokens; above 100K
    // input tokens a request would cost $0.50 and $2.50.
    expect(BATCH_SIZE * perRequest).toBeGreaterThan(HAIKU_5_5_LONG_CONTEXT);
    expect(perRequest).toBeLessThan(HAIKU_5_5_LONG_CONTEXT);
    expect(result.current.costUsd).toBeCloseTo(
      (BATCH_SIZE *
        (perRequest * HAIKU_5_5.input + OUTPUT_TOKENS * HAIKU_5_5.output)) /
        PER_MILLION,
      DIGITS
    );
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
