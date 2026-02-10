import { describe, expect, it } from "vitest";
import type { KRD } from "../schemas/krd";
import { KrdValidationError } from "../types/errors";
import { extractWorkout } from "./extract-workout";

const validWorkout = {
  name: "Test Workout",
  sport: "cycling",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 600 },
      targetType: "power",
      target: { type: "power", value: { unit: "watts", value: 200 } },
      intensity: "warmup",
    },
  ],
};

const validKrd: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2025-01-15T10:00:00Z", sport: "cycling" },
  extensions: { structured_workout: validWorkout },
};

describe("extractWorkout", () => {
  it("should return workout for valid structured_workout KRD", () => {
    const workout = extractWorkout(validKrd);

    expect(workout.name).toBe("Test Workout");
    expect(workout.sport).toBe("cycling");
    expect(workout.steps).toHaveLength(1);
  });

  it("should throw for wrong KRD type", () => {
    const krd: KRD = { ...validKrd, type: "recorded_activity" };

    expect(() => extractWorkout(krd)).toThrow(KrdValidationError);
    expect(() => extractWorkout(krd)).toThrow(
      'Expected type "structured_workout"'
    );
  });

  it("should throw for missing extensions", () => {
    const krd: KRD = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2025-01-15T10:00:00Z", sport: "cycling" },
    };

    expect(() => extractWorkout(krd)).toThrow(KrdValidationError);
  });

  it("should throw for missing extensions.structured_workout", () => {
    const krd: KRD = {
      ...validKrd,
      extensions: { fit: {} },
    };

    expect(() => extractWorkout(krd)).toThrow(KrdValidationError);
  });

  it("should throw for primitive structured_workout value", () => {
    const krd: KRD = {
      ...validKrd,
      extensions: { structured_workout: "not an object" },
    };

    expect(() => extractWorkout(krd)).toThrow(KrdValidationError);
  });

  it("should throw for null structured_workout value", () => {
    const krd: KRD = {
      ...validKrd,
      extensions: { structured_workout: null },
    };

    expect(() => extractWorkout(krd)).toThrow(KrdValidationError);
  });

  it("should throw for array structured_workout value", () => {
    const krd: KRD = {
      ...validKrd,
      extensions: { structured_workout: [1, 2, 3] },
    };

    expect(() => extractWorkout(krd)).toThrow(KrdValidationError);
  });

  it("should throw for invalid workout structure", () => {
    const krd: KRD = {
      ...validKrd,
      extensions: { structured_workout: { name: "No sport or steps" } },
    };

    expect(() => extractWorkout(krd)).toThrow(KrdValidationError);
  });

  it("should preserve all optional workout fields", () => {
    const fullWorkout = {
      ...validWorkout,
      subSport: "indoor_cycling",
      poolLength: 25,
      poolLengthUnit: "meters",
    };
    const krd: KRD = {
      ...validKrd,
      extensions: { structured_workout: fullWorkout },
    };

    const workout = extractWorkout(krd);

    expect(workout.subSport).toBe("indoor_cycling");
    expect(workout.poolLength).toBe(25);
  });
});
