import { describe, expect, it } from "vitest";

import { POOL_LENGTH_25 } from "../../test-utils/tolerance-constants";
import { KrdValidationError } from "../types/errors";
import { createWorkoutKRD } from "./workout-to-krd.converter";

const validWorkout = {
  name: "FTP Intervals",
  sport: "cycling",
  subSport: "indoor_cycling",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 600 },
      targetType: "power",
      target: { type: "power", value: { unit: "percent_ftp", value: 60 } },
      intensity: "warmup",
    },
  ],
};

describe("createWorkoutKRD", () => {
  it("should create valid KRD from raw workout JSON", () => {
    // Arrange

    // Act
    const krd = createWorkoutKRD(validWorkout, {
      created: "2025-01-15T10:00:00Z",
    });

    // Assert
    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("structured_workout");
    expect(krd.extensions?.structured_workout).toEqual(validWorkout);
  });

  it("should set metadata.sport from workout", () => {
    // Arrange

    // Act
    const krd = createWorkoutKRD(validWorkout, {
      created: "2025-01-15T10:00:00Z",
    });

    // Assert
    expect(krd.metadata.sport).toBe("cycling");
  });

  it("should propagate subSport to metadata when present", () => {
    // Arrange

    // Act
    const krd = createWorkoutKRD(validWorkout, {
      created: "2025-01-15T10:00:00Z",
    });

    // Assert
    expect(krd.metadata.subSport).toBe("indoor_cycling");
  });

  it("should omit subSport from metadata when absent", () => {
    // Arrange
    const workoutWithoutSubSport: Partial<typeof validWorkout> = {
      ...validWorkout,
    };
    delete workoutWithoutSubSport.subSport;

    // Act
    const krd = createWorkoutKRD(
      workoutWithoutSubSport as typeof validWorkout,
      {
        created: "2025-01-15T10:00:00Z",
      }
    );

    // Assert
    expect(krd.metadata.subSport).toBeUndefined();
  });

  it("should use provided created timestamp", () => {
    // Arrange

    // Act
    const krd = createWorkoutKRD(validWorkout, {
      created: "2025-06-01T12:00:00Z",
    });

    // Assert
    expect(krd.metadata.created).toBe("2025-06-01T12:00:00Z");
  });

  it("should generate valid ISO timestamp when created not provided", () => {
    // Arrange

    // Act
    const krd = createWorkoutKRD(validWorkout);

    // Assert
    expect(krd.metadata.created).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });

  it("should throw KrdValidationError for invalid workout", () => {
    // Arrange

    // Act

    // Assert
    expect(() => createWorkoutKRD({ name: "No sport" })).toThrow(
      KrdValidationError
    );
  });

  it("should throw KrdValidationError for missing steps", () => {
    // Arrange

    // Act

    // Assert
    expect(() => createWorkoutKRD({ sport: "cycling" })).toThrow(
      KrdValidationError
    );
  });

  it("should preserve optional poolLength fields", () => {
    // Arrange
    const swimming = {
      sport: "swimming",
      subSport: "lap_swimming",
      poolLength: 25,
      poolLengthUnit: "meters" as const,
      steps: [
        {
          stepIndex: 0,
          durationType: "distance",
          duration: { type: "distance", meters: 100 },
          targetType: "open",
          target: { type: "open" },
        },
      ],
    };
    const krd = createWorkoutKRD(swimming, {
      created: "2025-01-15T10:00:00Z",
    });

    // Act
    const workout = krd.extensions?.structured_workout as Record<
      string,
      unknown
    >;

    // Assert
    expect(workout.poolLength).toBe(POOL_LENGTH_25);
    expect(workout.poolLengthUnit).toBe("meters");
  });
});
