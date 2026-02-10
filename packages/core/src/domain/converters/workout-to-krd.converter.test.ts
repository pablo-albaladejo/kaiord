import { describe, expect, it } from "vitest";
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
    const krd = createWorkoutKRD(validWorkout, {
      created: "2025-01-15T10:00:00Z",
    });

    expect(krd.version).toBe("1.0");
    expect(krd.type).toBe("structured_workout");
    expect(krd.extensions?.structured_workout).toEqual(validWorkout);
  });

  it("should set metadata.sport from workout", () => {
    const krd = createWorkoutKRD(validWorkout, {
      created: "2025-01-15T10:00:00Z",
    });

    expect(krd.metadata.sport).toBe("cycling");
  });

  it("should propagate subSport to metadata when present", () => {
    const krd = createWorkoutKRD(validWorkout, {
      created: "2025-01-15T10:00:00Z",
    });

    expect(krd.metadata.subSport).toBe("indoor_cycling");
  });

  it("should omit subSport from metadata when absent", () => {
    const { subSport: _, ...workoutWithoutSubSport } = validWorkout;

    const krd = createWorkoutKRD(workoutWithoutSubSport, {
      created: "2025-01-15T10:00:00Z",
    });

    expect(krd.metadata.subSport).toBeUndefined();
  });

  it("should use provided created timestamp", () => {
    const krd = createWorkoutKRD(validWorkout, {
      created: "2025-06-01T12:00:00Z",
    });

    expect(krd.metadata.created).toBe("2025-06-01T12:00:00Z");
  });

  it("should generate valid ISO timestamp when created not provided", () => {
    const krd = createWorkoutKRD(validWorkout);

    expect(krd.metadata.created).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });

  it("should throw KrdValidationError for invalid workout", () => {
    expect(() => createWorkoutKRD({ name: "No sport" })).toThrow(
      KrdValidationError
    );
  });

  it("should throw KrdValidationError for missing steps", () => {
    expect(() => createWorkoutKRD({ sport: "cycling" })).toThrow(
      KrdValidationError
    );
  });

  it("should preserve optional poolLength fields", () => {
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
    const workout = krd.extensions?.structured_workout as Record<
      string,
      unknown
    >;

    expect(workout.poolLength).toBe(25);
    expect(workout.poolLengthUnit).toBe("meters");
  });
});
