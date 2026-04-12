import { describe, expect, it } from "vitest";

import { estimateCost, estimateTokens } from "./cost-estimation";
import { makeWorkoutRecord } from "./test-helpers";

describe("estimateTokens", () => {
  it("estimates tokens from description length", () => {
    const workout = makeWorkoutRecord({
      raw: {
        title: "Run",
        description: "A".repeat(300),
        comments: [],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "h",
      },
    });

    const result = estimateTokens([workout]);

    // 300 chars / 3 = 100 input tokens + 500 output = 600
    expect(result).toBe(600);
  });

  it("includes comment text in estimation", () => {
    const workout = makeWorkoutRecord({
      raw: {
        title: "Run",
        description: "A".repeat(300),
        comments: [
          {
            author: "coach",
            text: "B".repeat(150),
            timestamp: "2025-01-15T10:00:00Z",
          },
        ],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "h",
      },
    });

    const result = estimateTokens([workout]);

    // (300 + 150) / 3 = 150 input + 500 output = 650
    expect(result).toBe(650);
  });

  it("skips workouts without raw data", () => {
    const workout = makeWorkoutRecord({ raw: null });

    const result = estimateTokens([workout]);

    expect(result).toBe(0);
  });

  it("sums tokens across multiple workouts", () => {
    const w1 = makeWorkoutRecord({
      raw: {
        title: "A",
        description: "A".repeat(300),
        comments: [],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "h1",
      },
    });
    const w2 = makeWorkoutRecord({
      raw: {
        title: "B",
        description: "B".repeat(600),
        comments: [],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "h2",
      },
    });

    const result = estimateTokens([w1, w2]);

    // w1: 100 + 500 = 600, w2: 200 + 500 = 700 => 1300
    expect(result).toBe(1300);
  });

  it("rounds up fractional tokens", () => {
    const workout = makeWorkoutRecord({
      raw: {
        title: "X",
        description: "A".repeat(10),
        comments: [],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "h",
      },
    });

    const result = estimateTokens([workout]);

    // 10 / 3 = 3.33 -> ceil = 4, + 500 = 504
    expect(result).toBe(504);
  });
});

describe("estimateCost", () => {
  it("calculates cost at given rate per million", () => {
    const result = estimateCost(1_000_000, 3.0);

    expect(result).toBe(3.0);
  });

  it("calculates fractional cost", () => {
    const result = estimateCost(500, 10.0);

    expect(result).toBeCloseTo(0.005);
  });

  it("returns zero for zero tokens", () => {
    const result = estimateCost(0, 5.0);

    expect(result).toBe(0);
  });
});
