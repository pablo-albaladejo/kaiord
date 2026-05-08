import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { KRD, RepetitionBlock, Workout, WorkoutStep } from "@kaiord/core";
import { createGarminParsingError, isRepetitionBlock } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  POOL_LENGTH_METERS,
  REPETITION,
  SEGMENT_COUNT,
  WORKOUT_NAME_MAX_LENGTH,
} from "../../test-utils/constants";
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
      // Arrange
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");

      // Act
      const krd = convertGarminToKRD(gcn, mockLogger);

      // Assert
      expect(krd.version).toBe("1.0");
      expect(krd.type).toBe("structured_workout");
      expect(krd.metadata.sport).toBe("running");
    });

    it("should extract workout name", () => {
      // Arrange
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);

      // Act
      const workout = getWorkout(krd);

      // Assert
      expect(workout.name).toBe("MEGA RUN - Complete API Test");
    });

    it("should convert warmup step with lap button", () => {
      // Arrange
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Act
      const warmup = workout.steps[0] as WorkoutStep;

      // Assert
      expect(warmup.intensity).toBe("warmup");
      expect(warmup.durationType).toBe("open");
      expect(warmup.targetType).toBe("open");
    });

    it("should convert time-based step with HR zone target", () => {
      // Arrange
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Act
      const interval = workout.steps[1] as WorkoutStep;

      // Assert
      expect(interval.durationType).toBe("time");
      expect(interval.duration).toEqual({ type: "time", seconds: 600 });
      expect(interval.targetType).toBe("heart_rate");
      expect(interval.target).toEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 4 },
      });
    });

    it("should convert distance-based recovery with HR range", () => {
      // Arrange
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Act
      const recovery = workout.steps[2] as WorkoutStep;

      // Assert
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
      // Arrange
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Act
      const calorieStep = workout.steps[3] as WorkoutStep;

      // Assert
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
      // Arrange
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Act
      const outerRepeat = workout.steps[4];

      // Assert
      expect(isRepetitionBlock(outerRepeat)).toBe(true);
      if (isRepetitionBlock(outerRepeat)) {
        expect(outerRepeat.repeatCount).toBe(REPETITION.COUNT_3);
        expect(outerRepeat.steps.length).toBeGreaterThan(0);
      }
    });

    it("should convert cooldown step", () => {
      // Arrange
      const gcn = loadFixture("WorkoutRunningNestedRepeatsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Act
      const lastStep = workout.steps[workout.steps.length - 1] as WorkoutStep;

      // Assert
      expect(lastStep.intensity).toBe("cooldown");
      expect(lastStep.durationType).toBe("open");
    });
  });

  describe("cycling workout with power and cadence", () => {
    it("should convert cycling workout", () => {
      // Arrange
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      expect(krd.metadata.sport).toBe("cycling");

      // Act
      const workout = getWorkout(krd);

      // Assert
      expect(workout.sport).toBe("cycling");
    });

    it("should convert power zone target", () => {
      // Arrange
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Act
      const warmup = workout.steps[0] as WorkoutStep;

      // Assert
      expect(warmup.target).toEqual({
        type: "power",
        value: { unit: "zone", value: 2 },
      });
    });

    it("should convert power range with secondary cadence", () => {
      // Arrange
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Act
      const interval = workout.steps[1] as WorkoutStep;

      // Assert
      expect(interval.target).toEqual({
        type: "power",
        value: { unit: "range", min: 200, max: 250 },
      });
    });

    it("should convert speed zone as pace range", () => {
      // Arrange
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Act
      const speedStep = workout.steps[2] as WorkoutStep;

      // Assert
      expect(speedStep.target).toEqual({
        type: "pace",
        value: { unit: "range", min: 7, max: 8.5 },
      });
    });

    it("should convert cadence range target", () => {
      // Arrange
      const gcn = loadFixture("WorkoutCyclingPowerCadenceOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Act
      const cadenceStep = workout.steps[4] as WorkoutStep;

      // Assert
      expect(cadenceStep.target).toEqual({
        type: "cadence",
        value: { unit: "range", min: 95, max: 105 },
      });
    });
  });

  describe("swimming workout with strokes and equipment", () => {
    it("should convert swimming workout with pool length", () => {
      // Arrange
      const gcn = loadFixture("WorkoutSwimmingAllStrokesOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      expect(krd.metadata.sport).toBe("swimming");

      // Act
      const workout = getWorkout(krd);

      // Assert
      expect(workout.poolLength).toBe(POOL_LENGTH_METERS.STANDARD);
      expect(workout.poolLengthUnit).toBe("meters");
    });

    it("should convert stroke types", () => {
      // Arrange
      const gcn = loadFixture("WorkoutSwimmingAllStrokesOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const flyStep = workout.steps[1] as WorkoutStep;
      expect(flyStep.targetType).toBe("stroke_type");

      // Act
      const backStep = workout.steps[2] as WorkoutStep;

      // Assert
      expect(backStep.targetType).toBe("stroke_type");
    });

    it("should convert equipment types", () => {
      // Arrange
      const gcn = loadFixture("WorkoutSwimmingAllStrokesOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const kickboardStep = workout.steps[5] as WorkoutStep;
      expect(kickboardStep.equipment).toBe("swim_kickboard");
      const pullBuoyStep = workout.steps[6] as WorkoutStep;
      expect(pullBuoyStep.equipment).toBe("swim_pull_buoy");
      const finsStep = workout.steps[7] as WorkoutStep;
      expect(finsStep.equipment).toBe("swim_fins");

      // Act
      const paddlesStep = workout.steps[8] as WorkoutStep;

      // Assert
      expect(paddlesStep.equipment).toBe("swim_paddles");
    });
  });

  describe("strength workout with reps", () => {
    it("should convert strength workout", () => {
      // Arrange
      const gcn = loadFixture("WorkoutStrengthRepsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      expect(krd.metadata.sport).toBe("generic");

      // Act
      const workout = getWorkout(krd);

      // Assert
      expect(workout.sport).toBe("generic");
    });

    it("should convert reps end condition as open duration", () => {
      // Arrange
      const gcn = loadFixture("WorkoutStrengthRepsOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);
      const repeatBlock = workout.steps[1] as RepetitionBlock;
      expect(repeatBlock.repeatCount).toBe(REPETITION.COUNT_3);

      // Act
      const repsStep = repeatBlock.steps[0];

      // Assert
      expect(repsStep.durationType).toBe("open");
    });
  });

  describe("edge cases", () => {
    it("should handle long workout names (truncated to 255 chars)", () => {
      // Arrange
      const gcn = loadFixture("WorkoutEdgeCasesOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);

      // Act
      const workout = getWorkout(krd);

      // Assert
      expect(workout.name!.length).toBeLessThanOrEqual(WORKOUT_NAME_MAX_LENGTH);
    });

    it("should handle single-iteration repeat blocks", () => {
      // Arrange
      const gcn = loadFixture("WorkoutEdgeCasesOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);
      const workout = getWorkout(krd);

      // Act
      const repeat = workout.steps[0];

      // Assert
      expect(isRepetitionBlock(repeat)).toBe(true);
      if (isRepetitionBlock(repeat)) {
        expect(repeat.repeatCount).toBe(1);
      }
    });
  });

  describe("multisport triathlon", () => {
    it("should flatten multiple segments into steps", () => {
      // Arrange
      const gcn = loadFixture("WorkoutMultisportTriathlonOutput.gcn");
      const krd = convertGarminToKRD(gcn, mockLogger);

      // Act
      const workout = getWorkout(krd);

      // Assert
      expect(workout.steps.length).toBe(SEGMENT_COUNT.TRIATHLON);
    });
  });

  describe("error handling", () => {
    it("should throw on invalid JSON", () => {
      // Arrange

      // Act

      // Assert
      expect(() => convertGarminToKRD("not json", mockLogger)).toThrow(
        createGarminParsingError("").constructor
      );
    });

    it("should throw on non-object input", () => {
      // Arrange

      // Act

      // Assert
      expect(() => convertGarminToKRD('"string"', mockLogger)).toThrow();
    });
  });
});
