import { describe, expect, it } from "vitest";

import type { KRD, Workout } from "../../../types/krd";
import { extractStructuredWorkout } from "./extract-workout";

const baseKrd = (overrides: Partial<KRD> = {}): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2025-01-01T00:00:00Z", sport: "running" },
  ...overrides,
});

describe("extractStructuredWorkout", () => {
  it("should return null when extensions is missing", () => {
    // Arrange
    const krd = baseKrd();

    // Act
    const result = extractStructuredWorkout(krd);

    // Assert
    expect(result).toBeNull();
  });

  it("should return null when structured_workout is missing", () => {
    // Arrange
    const krd = baseKrd({ extensions: {} });

    // Act
    const result = extractStructuredWorkout(krd);

    // Assert
    expect(result).toBeNull();
  });

  it("should return the workout payload when present", () => {
    // Arrange
    const workout: Workout = {
      name: "Test",
      sport: "running",
      steps: [],
    };
    const krd = baseKrd({
      extensions: { structured_workout: workout },
    });

    // Act
    const result = extractStructuredWorkout(krd);

    // Assert
    expect(result).toEqual(workout);
  });
});
