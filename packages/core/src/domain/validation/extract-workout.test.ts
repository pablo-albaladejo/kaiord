import { describe, expect, it } from "vitest";

import {
  POOL_LENGTH_25,
  SAMPLE_BUFFER_BYTES,
} from "../../test-utils/tolerance-constants";
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
    // Arrange

    // Act
    const workout = extractWorkout(validKrd);

    // Assert
    expect(workout.name).toBe("Test Workout");
    expect(workout.sport).toBe("cycling");
    expect(workout.steps).toHaveLength(1);
  });

  it("should throw for wrong KRD type", () => {
    // Arrange
    const krd: KRD = { ...validKrd, type: "recorded_activity" };

    // Act
    const act = () => extractWorkout(krd);

    // Assert
    expect(act).toThrow(KrdValidationError);
    expect(act).toThrow('Expected type "structured_workout"');
  });

  it.each<[string, KRD]>([
    [
      "missing extensions",
      {
        version: "1.0",
        type: "structured_workout",
        metadata: { created: "2025-01-15T10:00:00Z", sport: "cycling" },
      },
    ],
    [
      "missing extensions.structured_workout",
      { ...validKrd, extensions: { fit: {} } },
    ],
    [
      "a primitive structured_workout value",
      { ...validKrd, extensions: { structured_workout: "not an object" } },
    ],
    [
      "a null structured_workout value",
      { ...validKrd, extensions: { structured_workout: null } },
    ],
    [
      "an array structured_workout value",
      {
        ...validKrd,
        extensions: { structured_workout: [...SAMPLE_BUFFER_BYTES] },
      },
    ],
  ])("should throw for %s", (_name, krd) => {
    // Arrange

    // Act

    // Assert
    expect(() => extractWorkout(krd)).toThrow(KrdValidationError);
  });

  it("should throw for invalid workout structure", () => {
    // Arrange

    // Act
    const krd: KRD = {
      ...validKrd,
      extensions: { structured_workout: { name: "No sport or steps" } },
    };

    // Assert
    expect(() => extractWorkout(krd)).toThrow(KrdValidationError);
  });

  it("should preserve all optional workout fields", () => {
    // Arrange
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

    // Act
    const workout = extractWorkout(krd);

    // Assert
    expect(workout.subSport).toBe("indoor_cycling");
    expect(workout.poolLength).toBe(POOL_LENGTH_25);
  });
});
