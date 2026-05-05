import { describe, expect, it } from "vitest";

import type { KRD, Workout } from "../../../types/krd";
import { buildKrdWithWorkout } from "./build-krd-with-workout";

describe("buildKrdWithWorkout", () => {
  it("should set structured_workout while preserving the rest of the KRD", () => {
    // Arrange
    const original: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2025-01-01T00:00:00Z", sport: "running" },
      extensions: {
        structured_workout: { name: "old", sport: "running", steps: [] },
      },
    };
    const updatedWorkout: Workout = {
      name: "new",
      sport: "cycling",
      steps: [],
    };

    // Act
    const result = buildKrdWithWorkout(original, updatedWorkout);

    // Assert
    expect(result.extensions?.structured_workout).toEqual(updatedWorkout);
    expect(result.metadata).toEqual(original.metadata);
  });

  it("should preserve sibling extensions other than structured_workout", () => {
    // Arrange
    const original: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2025-01-01T00:00:00Z", sport: "running" },
      extensions: {
        structured_workout: { name: "old", sport: "running", steps: [] },
        custom: { foo: "bar" },
      } as KRD["extensions"],
    };
    const updatedWorkout: Workout = {
      name: "new",
      sport: "running",
      steps: [],
    };

    // Act
    const result = buildKrdWithWorkout(original, updatedWorkout);

    // Assert
    expect(
      (result.extensions as { custom?: { foo: string } } | undefined)?.custom
    ).toEqual({ foo: "bar" });
  });

  it("should return a fresh KRD object distinct from the input", () => {
    // Arrange
    const original: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2025-01-01T00:00:00Z", sport: "running" },
    };
    const workout: Workout = { name: "x", sport: "running", steps: [] };

    // Act
    const result = buildKrdWithWorkout(original, workout);

    // Assert
    expect(result).not.toBe(original);
  });
});
