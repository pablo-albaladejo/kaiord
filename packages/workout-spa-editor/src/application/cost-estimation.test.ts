import { describe, expect, it } from "vitest";

import {
  COMMENT_LEN_150,
  DESCRIPTION_LEN_10,
  DESCRIPTION_LEN_300,
  DESCRIPTION_LEN_600,
  EXPECTED_COST_USD_3,
  EXPECTED_COST_USD_FRACTIONAL,
  EXPECTED_TOKENS_300_CHARS,
  EXPECTED_TOKENS_300_PLUS_150,
  EXPECTED_TOKENS_900_CHARS,
  EXPECTED_TOKENS_BASELINE_PLUS_10,
  EXPECTED_TOKENS_ZERO,
  ONE_MILLION_TOKENS,
  RATE_USD_PER_MTOK_3,
  RATE_USD_PER_MTOK_5,
  RATE_USD_PER_MTOK_10,
  TOKENS_500,
  TOKENS_ZERO,
} from "../test-utils/application-fixtures";
import { estimateCost, estimateTokens } from "./cost-estimation";
import { makeWorkoutRecord } from "./test-helpers";

describe("estimateTokens", () => {
  it("should estimate tokens from description length", () => {
    // Arrange
    const workout = makeWorkoutRecord({
      raw: {
        title: "Run",
        description: "A".repeat(DESCRIPTION_LEN_300),
        comments: [],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "h",
      },
    });

    // Act
    const result = estimateTokens([workout]);

    // Assert
    expect(result).toBe(EXPECTED_TOKENS_300_CHARS);
  });

  it("should include comment text in estimation", () => {
    // Arrange
    const workout = makeWorkoutRecord({
      raw: {
        title: "Run",
        description: "A".repeat(DESCRIPTION_LEN_300),
        comments: [
          {
            author: "coach",
            text: "B".repeat(COMMENT_LEN_150),
            timestamp: "2025-01-15T10:00:00Z",
          },
        ],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "h",
      },
    });

    // Act
    const result = estimateTokens([workout]);

    // Assert
    expect(result).toBe(EXPECTED_TOKENS_300_PLUS_150);
  });

  it("should skip workouts without raw data", () => {
    // Arrange
    const workout = makeWorkoutRecord({ raw: null });

    // Act
    const result = estimateTokens([workout]);

    // Assert
    expect(result).toBe(EXPECTED_TOKENS_ZERO);
  });

  it("should sum tokens across multiple workouts", () => {
    // Arrange
    const w1 = makeWorkoutRecord({
      raw: {
        title: "A",
        description: "A".repeat(DESCRIPTION_LEN_300),
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
        description: "B".repeat(DESCRIPTION_LEN_600),
        comments: [],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "h2",
      },
    });

    // Act
    const result = estimateTokens([w1, w2]);

    // Assert
    expect(result).toBe(EXPECTED_TOKENS_900_CHARS);
  });

  it("should round up fractional tokens", () => {
    // Arrange
    const workout = makeWorkoutRecord({
      raw: {
        title: "X",
        description: "A".repeat(DESCRIPTION_LEN_10),
        comments: [],
        distance: null,
        duration: null,
        prescribedRpe: null,
        rawHash: "h",
      },
    });

    // Act
    const result = estimateTokens([workout]);

    // Assert
    expect(result).toBe(EXPECTED_TOKENS_BASELINE_PLUS_10);
  });
});

describe("estimateCost", () => {
  it("should calculate cost at given rate per million", () => {
    // Arrange

    // Act
    const result = estimateCost(ONE_MILLION_TOKENS, RATE_USD_PER_MTOK_3);

    // Assert
    expect(result).toBe(EXPECTED_COST_USD_3);
  });

  it("should calculate fractional cost", () => {
    // Arrange

    // Act
    const result = estimateCost(TOKENS_500, RATE_USD_PER_MTOK_10);

    // Assert
    expect(result).toBeCloseTo(EXPECTED_COST_USD_FRACTIONAL);
  });

  it("should return zero for zero tokens", () => {
    // Arrange

    // Act
    const result = estimateCost(TOKENS_ZERO, RATE_USD_PER_MTOK_5);

    // Assert
    expect(result).toBe(EXPECTED_TOKENS_ZERO);
  });
});
