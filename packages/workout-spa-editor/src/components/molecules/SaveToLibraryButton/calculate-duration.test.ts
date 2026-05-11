/* eslint-disable no-magic-numbers -- test fixtures use literal duration values for clarity */
import { describe, expect, it } from "vitest";

import type { KRD } from "../../../types/krd";
import { calculateWorkoutDuration } from "./calculate-duration";

const wrap = (steps: unknown): KRD =>
  ({ extensions: { structured_workout: { steps } } }) as unknown as KRD;

describe("calculateWorkoutDuration", () => {
  it("should return undefined when workout has no extensions", () => {
    // Arrange
    const workout = {} as unknown as KRD;

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined when extensions.structured_workout is missing", () => {
    // Arrange
    const workout = { extensions: {} } as unknown as KRD;

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined when structured_workout is not an object (string)", () => {
    // Arrange
    const workout = {
      extensions: { structured_workout: "invalid" },
    } as unknown as KRD;

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined when structured_workout has no steps key", () => {
    // Arrange
    const workout = {
      extensions: { structured_workout: { other: 1 } },
    } as unknown as KRD;

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined when structured_workout.steps is not an array", () => {
    // Arrange
    const workout = {
      extensions: { structured_workout: { steps: "nope" } },
    } as unknown as KRD;

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should return undefined when steps array is empty", () => {
    // Arrange
    const workout = wrap([]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should sum a single time-step with seconds=120 to 120", () => {
    // Arrange
    const workout = wrap([{ duration: { type: "time", seconds: 120 } }]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBe(120);
  });

  it("should sum two leaf time-steps (60 + 90) to 150", () => {
    // Arrange
    const workout = wrap([
      { duration: { type: "time", seconds: 60 } },
      { duration: { type: "time", seconds: 90 } },
    ]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBe(150);
  });

  it("should ignore leaf step whose duration is null", () => {
    // Arrange
    const workout = wrap([{ duration: null }]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should ignore leaf step whose duration.type is 'distance'", () => {
    // Arrange
    const workout = wrap([{ duration: { type: "distance", meters: 1000 } }]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should ignore leaf step whose duration is missing seconds key", () => {
    // Arrange
    const workout = wrap([{ duration: { type: "time" } }]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should ignore leaf step where seconds is not a number (string)", () => {
    // Arrange
    const workout = wrap([{ duration: { type: "time", seconds: "60" } }]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should expand a repeat block { repeatCount: 3, steps: [60s] } to 180", () => {
    // Arrange
    const workout = wrap([
      {
        repeatCount: 3,
        steps: [{ duration: { type: "time", seconds: 60 } }],
      },
    ]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBe(180);
  });

  it("should treat repeat block with repeatCount=0 as 0 contribution", () => {
    // Arrange
    const workout = wrap([
      {
        repeatCount: 0,
        steps: [{ duration: { type: "time", seconds: 60 } }],
      },
    ]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should treat repeat block with repeatCount=1 the same as a single iteration", () => {
    // Arrange
    const workout = wrap([
      {
        repeatCount: 1,
        steps: [{ duration: { type: "time", seconds: 120 } }],
      },
    ]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBe(120);
  });

  it("should ignore non-time inner step inside a repeat block (distance)", () => {
    // Arrange
    const workout = wrap([
      {
        repeatCount: 2,
        steps: [{ duration: { type: "distance", meters: 500 } }],
      },
    ]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should ignore inner step whose duration is null inside a repeat block", () => {
    // Arrange
    const workout = wrap([{ repeatCount: 2, steps: [{ duration: null }] }]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should ignore inner step missing 'seconds' key inside a repeat block", () => {
    // Arrange
    const workout = wrap([
      { repeatCount: 2, steps: [{ duration: { type: "time" } }] },
    ]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should ignore inner step whose seconds is not a number inside a repeat block", () => {
    // Arrange
    const workout = wrap([
      {
        repeatCount: 2,
        steps: [{ duration: { type: "time", seconds: "x" } }],
      },
    ]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should ignore inner step that is not an object (number) inside a repeat block", () => {
    // Arrange
    const workout = wrap([{ repeatCount: 2, steps: [42] }]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should sum a leaf step (60) plus a repeat block (3x40=120) to 180", () => {
    // Arrange
    const workout = wrap([
      { duration: { type: "time", seconds: 60 } },
      {
        repeatCount: 3,
        steps: [{ duration: { type: "time", seconds: 40 } }],
      },
    ]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBe(180);
  });

  it("should ignore step that is null at top level", () => {
    // Arrange
    const workout = wrap([null]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should ignore step that is a primitive (string) at top level", () => {
    // Arrange
    const workout = wrap(["nope"]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should ignore repeat-block-shaped step whose inner steps is not an array", () => {
    // Arrange
    const workout = wrap([{ repeatCount: 2, steps: "nope" }]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should ignore step that has 'repeatCount' but no 'steps' key", () => {
    // Arrange
    const workout = wrap([{ repeatCount: 2 }]);

    // Act
    const result = calculateWorkoutDuration(workout);

    // Assert
    expect(result).toBeUndefined();
  });
});
