import { KrdValidationError } from "@kaiord/core";
import { describe, expect, it } from "vitest";
import { createWorkoutToGarmin, workoutToGarmin } from "./workout-to-garmin";

const validWorkout = {
  name: "Test Cycling Workout",
  sport: "cycling",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 600 },
      targetType: "power",
      target: { type: "power", value: { unit: "percent_ftp", value: 60 } },
      intensity: "warmup",
    },
    {
      stepIndex: 1,
      durationType: "time",
      duration: { type: "time", seconds: 300 },
      targetType: "power",
      target: { type: "power", value: { unit: "watts", value: 250 } },
      intensity: "active",
    },
  ],
};

describe("workoutToGarmin", () => {
  it("should return valid JSON string for valid workout", async () => {
    const result = await workoutToGarmin(validWorkout);

    const parsed = JSON.parse(result);
    expect(parsed).toBeDefined();
  });

  it("should include workout name in output", async () => {
    const result = await workoutToGarmin(validWorkout);

    const parsed = JSON.parse(result);
    expect(parsed.workoutName).toBe("Test Cycling Workout");
  });

  it("should include sport type in output", async () => {
    const result = await workoutToGarmin(validWorkout);

    const parsed = JSON.parse(result);
    expect(parsed.sportType.sportTypeKey).toBe("cycling");
  });

  it("should include workout steps in segments", async () => {
    const result = await workoutToGarmin(validWorkout);

    const parsed = JSON.parse(result);
    expect(parsed.workoutSegments).toHaveLength(1);
    expect(parsed.workoutSegments[0].workoutSteps).toHaveLength(2);
  });

  it("should handle repetition blocks", async () => {
    const workoutWithRepeats = {
      sport: "cycling",
      steps: [
        {
          repeatCount: 3,
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 300 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "percent_ftp", value: 100 },
              },
              intensity: "active",
            },
          ],
        },
      ],
    };

    const result = await workoutToGarmin(workoutWithRepeats);

    const parsed = JSON.parse(result);
    const step = parsed.workoutSegments[0].workoutSteps[0];
    expect(step.type).toBe("RepeatGroupDTO");
    expect(step.numberOfIterations).toBe(3);
  });

  it("should throw KrdValidationError for invalid workout", async () => {
    await expect(workoutToGarmin({ name: "bad" })).rejects.toThrow(
      KrdValidationError
    );
  });

  it("should accept custom logger via factory", async () => {
    const logs: string[] = [];
    const logger = {
      info: (msg: string) => logs.push(msg),
      warn: (msg: string) => logs.push(msg),
      error: (msg: string) => logs.push(msg),
      debug: (msg: string) => logs.push(msg),
    };
    const convert = createWorkoutToGarmin(logger);

    await convert(validWorkout);

    expect(logs.length).toBeGreaterThan(0);
  });
});
