import { describe, expect, it } from "vitest";

import { estimateCost, estimateTokens } from "./cost-estimation";
import { makeWorkoutRecord } from "./test-helpers";

describe("estimateTokens", () => {
  it("should estimate tokens from description length", () => {
    // Arrange
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

    // Act
    const result = estimateTokens([workout]);

    // Assert
    expect(result).toBe(600);
  });

  it("should include comment text in estimation", () => {
    // Arrange
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

    // Act
    const result = estimateTokens([workout]);

    // Assert
    expect(result).toBe(650);
  });

  it("should skip workouts without raw data", () => {
    // Arrange
    const workout = makeWorkoutRecord({ raw: null });

    // Act
    const result = estimateTokens([workout]);

    // Assert
    expect(result).toBe(0);
  });

  it("should sum tokens across multiple workouts", () => {
    // Arrange
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

    // Act
    const result = estimateTokens([w1, w2]);

    // Assert
    expect(result).toBe(1300);
  });

  it("should round up fractional tokens", () => {
    // Arrange
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

    // Act
    const result = estimateTokens([workout]);

    // Assert
    expect(result).toBe(504);
  });
});

describe("estimateCost", () => {
  it("should calculate cost at given rate per million", () => {
    // Arrange

    // Act
    const result = estimateCost(1_000_000, 3.0);

    // Assert
    expect(result).toBe(3.0);
  });

  it("should calculate fractional cost", () => {
    // Arrange

    // Act
    const result = estimateCost(500, 10.0);

    // Assert
    expect(result).toBeCloseTo(0.005);
  });

  it("should return zero for zero tokens", () => {
    // Arrange

    // Act
    const result = estimateCost(0, 5.0);

    // Assert
    expect(result).toBe(0);
  });
});
