import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { KRD, RepetitionBlock, Workout, WorkoutStep } from "@kaiord/core";
import { createGarminParsingError, isRepetitionBlock } from "@kaiord/core";
import { convertGarminToKRD } from "./garmin-to-krd.converter";

const fixturesDir = join(__dirname, "../../../../../test-fixtures/gcn");

const loadFixture = (name: string): string =>
  readFileSync(join(fixturesDir, name), "utf-8");

const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

const getWorkout = (krd: KRD): Workout =>
  krd.extensions?.structured_workout as Workout;

describe("convertGarminToKRD", () => {
  describe("running workout with nested repeats", () => {
    it("should convert running workout to valid KRD", () => {
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);

      expect(krd.version).toBe("1.0");
      expect(krd.type).toBe("structured_workout");
      expect(krd.metadata.sport).toBe("running");
    });

    it("should extract workout name", () => {
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      expect(workout.name).toBe("MEGA RUN - Complete API Test");
    });

    it("should convert warmup step with lap button", () => {
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const warmup = workout.steps[0] as WorkoutStep;

      expect(warmup.intensity).toBe("warmup");
      expect(warmup.durationType).toBe("open");
      expect(warmup.targetType).toBe("open");
    });

    it("should convert time-based step with HR zone target", () => {
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const interval = workout.steps[1] as WorkoutStep;

      expect(interval.durationType).toBe("time");
      expect(interval.duration).toEqual({ type: "time", seconds: 600 });
      expect(interval.targetType).toBe("heart_rate");
      expect(interval.target).toEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 4 },
      });
    });

    it("should convert distance-based recovery with HR range", () => {
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const recovery = workout.steps[2] as WorkoutStep;

      expect(recovery.intensity).toBe("recovery");
      expect(recovery.durationType).toBe("distance");
      expect(recovery.duration).toEqual({
        type: "distance",
        meters: 400,
      });
      expect(recovery.target).toEqual({
        type: "heart_rate",
        value: { unit: "range", min: 120, max: 140 },
      });
    });

    it("should convert calories-based step with pace range", () => {
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const calorieStep = workout.steps[3] as WorkoutStep;

      expect(calorieStep.durationType).toBe("calories");
      expect(calorieStep.duration).toEqual({
        type: "calories",
        calories: 50,
      });
      expect(calorieStep.target).toEqual({
        type: "pace",
        value: { unit: "range", min: 3.5, max: 4 },
      });
    });

    it("should convert nested repeat groups", () => {
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const outerRepeat = workout.steps[4];

      expect(isRepetitionBlock(outerRepeat)).toBe(true);
      if (isRepetitionBlock(outerRepeat)) {
        expect(outerRepeat.repeatCount).toBe(3);
        expect(outerRepeat.steps.length).toBeGreaterThan(0);
      }
    });

    it("should convert cooldown step", () => {
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const lastStep = workout.steps[workout.steps.length - 1] as WorkoutStep;

      expect(lastStep.intensity).toBe("cooldown");
      expect(lastStep.durationType).toBe("open");
    });
  });

  describe("cycling workout with power and cadence", () => {
    it("should convert cycling workout", () => {
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);

      expect(krd.metadata.sport).toBe("cycling");
      const workout = getWorkout(krd);
      expect(workout.sport).toBe("cycling");
    });

    it("should convert power zone target", () => {
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const warmup = workout.steps[0] as WorkoutStep;

      expect(warmup.target).toEqual({
        type: "power",
        value: { unit: "zone", value: 2 },
      });
    });

    it("should convert power range with secondary cadence", () => {
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const interval = workout.steps[1] as WorkoutStep;

      expect(interval.target).toEqual({
        type: "power",
        value: { unit: "range", min: 200, max: 250 },
      });
    });

    it("should convert speed zone as pace range", () => {
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const speedStep = workout.steps[2] as WorkoutStep;

      expect(speedStep.target).toEqual({
        type: "pace",
        value: { unit: "range", min: 7, max: 8.5 },
      });
    });

    it("should convert cadence range target", () => {
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      // Step after repeat block - cadence only
      const cadenceStep = workout.steps[4] as WorkoutStep;

      expect(cadenceStep.target).toEqual({
        type: "cadence",
        value: { unit: "range", min: 95, max: 105 },
      });
    });
  });

  describe("swimming workout with strokes and equipment", () => {
    it("should convert swimming workout with pool length", () => {
      const gcn = loadFixture("WorkoutSwimmingAllStrokesOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);

      expect(krd.metadata.sport).toBe("swimming");
      const workout = getWorkout(krd);
      expect(workout.poolLength).toBe(25);
      expect(workout.poolLengthUnit).toBe("meters");
    });

    it("should convert stroke types", () => {
      const gcn = loadFixture("WorkoutSwimmingAllStrokesOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Butterfly step (index 1)
      const flyStep = workout.steps[1] as WorkoutStep;
      expect(flyStep.targetType).toBe("stroke_type");

      // Backstroke step (index 2)
      const backStep = workout.steps[2] as WorkoutStep;
      expect(backStep.targetType).toBe("stroke_type");
    });

    it("should convert equipment types", () => {
      const gcn = loadFixture("WorkoutSwimmingAllStrokesOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Kickboard step (index 5)
      const kickboardStep = workout.steps[5] as WorkoutStep;
      expect(kickboardStep.equipment).toBe("swim_kickboard");

      // Pull buoy step (index 6)
      const pullBuoyStep = workout.steps[6] as WorkoutStep;
      expect(pullBuoyStep.equipment).toBe("swim_pull_buoy");

      // Fins step (index 7)
      const finsStep = workout.steps[7] as WorkoutStep;
      expect(finsStep.equipment).toBe("swim_fins");

      // Paddles step (index 8)
      const paddlesStep = workout.steps[8] as WorkoutStep;
      expect(paddlesStep.equipment).toBe("swim_paddles");
    });
  });

  describe("strength workout with reps", () => {
    it("should convert strength workout", () => {
      const gcn = loadFixture("WorkoutStrengthRepsOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);

      expect(krd.metadata.sport).toBe("generic");
      const workout = getWorkout(krd);
      expect(workout.sport).toBe("generic");
    });

    it("should convert reps end condition as open duration", () => {
      const gcn = loadFixture("WorkoutStrengthRepsOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const repeatBlock = workout.steps[1] as RepetitionBlock;

      expect(repeatBlock.repeatCount).toBe(3);
      const repsStep = repeatBlock.steps[0];
      expect(repsStep.durationType).toBe("open");
    });
  });

  describe("edge cases", () => {
    it("should handle long workout names (truncated to 255 chars)", () => {
      const gcn = loadFixture("WorkoutEdgeCasesOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      expect(workout.name!.length).toBeLessThanOrEqual(255);
    });

    it("should handle single-iteration repeat blocks", () => {
      const gcn = loadFixture("WorkoutEdgeCasesOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const repeat = workout.steps[0];

      expect(isRepetitionBlock(repeat)).toBe(true);
      if (isRepetitionBlock(repeat)) {
        expect(repeat.repeatCount).toBe(1);
      }
    });
  });

  describe("multisport triathlon", () => {
    it("should flatten multiple segments into steps", () => {
      const gcn = loadFixture("WorkoutMultisportTriathlonOutput.gcn");

      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      expect(workout.steps.length).toBe(3);
    });
  });

  describe("error handling", () => {
    it("should throw on invalid JSON", () => {
      expect(() => convertGarminToKRD("not json", mockLogger)).toThrow(
        createGarminParsingError("").constructor
      );
    });

    it("should throw on non-object input", () => {
      expect(() => convertGarminToKRD('"string"', mockLogger)).toThrow();
    });
  });
});
