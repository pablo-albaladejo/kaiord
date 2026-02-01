import { describe, expect, it, vi } from "vitest";
import type { KRD } from "../../../domain/schemas/krd";
import { RepetitionBlock, WorkoutStep } from "../../../domain/schemas/workout";
import { FitParsingError } from "../../../domain/types/errors";
import { buildKRD } from "../../../tests/fixtures/krd/krd.fixtures";
import { buildKRDMetadata } from "../../../tests/fixtures/krd/metadata.fixtures";
import { buildWorkoutStep } from "../../../tests/fixtures/workout/workout-step.fixtures";
import { buildWorkout } from "../../../tests/fixtures/workout/workout.fixtures";
import { createMockLogger } from "../../../tests/helpers/test-utils";
import { fitDurationTypeSchema } from "../schemas/fit-duration";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import { convertKRDToMessages } from "./krd-to-fit.converter";

describe("convertKRDToMessages", () => {
  describe("metadata conversion", () => {
    it("should convert KRD metadata to file_id message", () => {
      // Arrange
      const logger = createMockLogger();
      const krd = buildKRD.build({
        metadata: buildKRDMetadata.build({
          created: "2025-01-15T10:30:00.000Z",
          manufacturer: "garmin",
          product: "fenix7",
          serialNumber: "1234567890",
          sport: "cycling",
        }),
        extensions: {
          workout: buildWorkout.build({ sport: "cycling" }),
        },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      const fileIdMsg = messages[0] as {
        mesgNum: number;
        mesgNum: number;
        manufacturer: string;
        serialNumber: number;
        timeCreated: Date;
      };
      expect(fileIdMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.FILE_ID);
      expect(fileIdMsg.type).toBe("workout");
      expect(fileIdMsg.manufacturer).toBe(krd.metadata.manufacturer);
      expect(fileIdMsg.serialNumber).toBe(Number(krd.metadata.serialNumber));
      expect(fileIdMsg.timeCreated).toBeInstanceOf(Date);
      expect(fileIdMsg.timeCreated.toISOString()).toBe(krd.metadata.created);
    });

    it("should use default manufacturer when not provided", () => {
      // Arrange
      const logger = createMockLogger();
      const krd = buildKRD.build({
        metadata: buildKRDMetadata.build({
          manufacturer: undefined,
        }),
        extensions: {
          workout: buildWorkout.build(),
        },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const fileIdMsg = messages[0] as {
        mesgNum: number;
        manufacturer: string;
      };
      expect(fileIdMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.FILE_ID);
      expect(fileIdMsg.manufacturer).toBe("garmin");
    });

    it("should convert created timestamp to Date object", () => {
      // Arrange
      const logger = createMockLogger();
      const krd = buildKRD.build({
        metadata: buildKRDMetadata.build({
          created: "2025-01-15T10:30:00.000Z",
        }),
        extensions: {
          workout: buildWorkout.build(),
        },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const fileIdMsg = messages[0] as {
        mesgNum: number;
        timeCreated: Date;
      };
      expect(fileIdMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.FILE_ID);
      expect(fileIdMsg.timeCreated).toBeInstanceOf(Date);
      expect(fileIdMsg.timeCreated.toISOString()).toBe(krd.metadata.created);
    });
  });

  describe("workout metadata conversion", () => {
    it("should convert workout metadata to workout message", () => {
      // Arrange
      const logger = createMockLogger();
      const workout = buildWorkout.build({
        name: "Test Workout",
        sport: "running",
        subSport: undefined,
      });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const workoutMsg = messages[1] as {
        mesgNum: number;
        wktName: string;
        sport: string;
        numValidSteps: number;
      };
      expect(workoutMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT);
      expect(workoutMsg.wktName).toBe(workout.name);
      expect(workoutMsg.sport).toBe(workout.sport);
      expect(workoutMsg.numValidSteps).toBeGreaterThan(0);
    });

    it("should convert workout with subSport to workout message", () => {
      // Arrange
      const logger = createMockLogger();
      const workout = buildWorkout.build({
        name: "Trail Run",
        sport: "running",
        subSport: "trail",
      });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const workoutMsg = messages[1] as {
        mesgNum: number;
        wktName: string;
        sport: string;
        subSport: string;
        numValidSteps: number;
      };
      expect(workoutMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT);
      expect(workoutMsg.wktName).toBe(workout.name);
      expect(workoutMsg.sport).toBe(workout.sport);
      expect(workoutMsg.subSport).toBe("trail");
      expect(workoutMsg.numValidSteps).toBeGreaterThan(0);
    });

    it("should omit subSport when undefined", () => {
      // Arrange
      const logger = createMockLogger();
      const workout = buildWorkout.build({
        name: "Generic Workout",
        sport: "cycling",
        subSport: undefined,
      });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const workoutMsg = messages[1] as Record<string, unknown>;
      expect(workoutMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT);
      expect(workoutMsg).not.toHaveProperty("subSport");
    });

    it("should convert workout with poolLength to workout message", () => {
      // Arrange
      const logger = createMockLogger();
      const workout = buildWorkout.build({
        name: "Swimming Workout",
        sport: "swimming",
        poolLength: 25,
        poolLengthUnit: "meters" as const,
      });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const workoutMsg = messages[1] as {
        mesgNum: number;
        poolLength: number;
        poolLengthUnit: number;
      };
      expect(workoutMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT);
      expect(workoutMsg.poolLength).toBe(25);
      expect(workoutMsg.poolLengthUnit).toBe(0);
    });

    it("should omit poolLength when undefined", () => {
      // Arrange
      const logger = createMockLogger();
      const workout = buildWorkout.build({
        name: "Running Workout",
        sport: "running",
        poolLength: undefined,
      });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const workoutMsg = messages[1] as Record<string, unknown>;
      expect(workoutMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT);
      expect(workoutMsg).not.toHaveProperty("poolLength");
      expect(workoutMsg).not.toHaveProperty("poolLengthUnit");
    });

    it("should calculate numValidSteps for individual steps", () => {
      // Arrange
      const logger = createMockLogger();
      const steps = [
        buildWorkoutStep.build({
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 200 },
          },
        }),
        buildWorkoutStep.build({
          stepIndex: 1,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 250 },
          },
        }),
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const workoutMsg = messages[1] as {
        mesgNum: number;
        numValidSteps: number;
      };
      expect(workoutMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT);
      expect(workoutMsg.numValidSteps).toBe(2);
    });

    it("should calculate numValidSteps including repetition blocks", () => {
      // Arrange
      const logger = createMockLogger();
      const repetitionBlock: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 },
            },
          },
          {
            stepIndex: 2,
            durationType: "time",
            duration: { type: "time", seconds: 60 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 100 },
            },
          },
        ],
      };
      const steps: Array<WorkoutStep | RepetitionBlock> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 150 },
          },
        },
        repetitionBlock,
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const workoutMsg = messages[1] as {
        mesgNum: number;
        numValidSteps: number;
      };
      expect(workoutMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT);
      expect(workoutMsg.numValidSteps).toBe(4);
    });
  });

  describe("workout step conversion", () => {
    it("should convert time-based duration step", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 200 },
          },
        },
      ];
      const workout = buildWorkout.build({ steps, subSport: undefined });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as {
        mesgNum: number;
        messageIndex: number;
        durationType: string;
        durationTime: number;
        durationValue: number;
        targetType: string;
        targetValue: number;
      };
      const step = steps[0];
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.messageIndex).toBe(step.stepIndex);
      expect(stepMsg.durationType).toBe(fitDurationTypeSchema.enum.time);
      expect(stepMsg.durationTime).toBe(step.duration.seconds);
      expect(stepMsg.durationValue).toBe(step.duration.seconds * 1000);
      expect(stepMsg.targetType).toBe("power");
      // Garmin encoding: 200 watts = 1200 (200 + 1000 offset)
      expect(stepMsg.targetValue).toBe(1200);
    });

    it("should convert workout step with notes", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 200 },
          },
          notes: "Focus on form and breathing",
        },
      ];
      const workout = buildWorkout.build({ steps, subSport: undefined });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as {
        mesgNum: number;
        notes: string;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.notes).toBe("Focus on form and breathing");
    });

    it("should omit notes when undefined", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 200 },
          },
          notes: undefined,
        },
      ];
      const workout = buildWorkout.build({ steps, subSport: undefined });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).not.toHaveProperty("notes");
    });

    it("should throw on notes exceeding 256 characters due to schema validation", () => {
      // Arrange
      const logger = createMockLogger();
      const longNotes = "a".repeat(300);
      // Note: Using type assertion to bypass TypeScript schema validation
      // to test runtime Zod validation behavior
      const workout = {
        name: "Test Workout",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 },
            },
            notes: longNotes,
          },
        ],
      };
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act & Assert
      expect(() => convertKRDToMessages(krd, logger)).toThrow(/notes.*256/i);
    });

    it("should accept notes at exactly 256 characters", () => {
      // Arrange
      const logger = createMockLogger();
      const maxNotes = "a".repeat(256);
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 200 },
          },
          notes: maxNotes,
        },
      ];
      const workout = buildWorkout.build({ steps, subSport: undefined });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as {
        mesgNum: number;
        notes: string;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.notes).toBe(maxNotes);
      expect(stepMsg.notes.length).toBe(256);
    });

    it("should convert distance-based duration step", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "distance",
          duration: { type: "distance", meters: 5000 },
          targetType: "pace",
          target: {
            type: "pace",
            value: { unit: "mps", value: 3.5 },
          },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      const step = steps[0];
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.messageIndex).toBe(step.stepIndex);
      expect(stepMsg.durationType).toBe(fitDurationTypeSchema.enum.distance);
      expect(stepMsg.durationDistance).toBe(step.duration.meters);
      expect(stepMsg.targetType).toBe("speed");
      expect(stepMsg).toHaveProperty("targetValue");
      expect(stepMsg).toHaveProperty("customTargetSpeedLow");
      expect(stepMsg).toHaveProperty("customTargetSpeedHigh");
    });

    it("should convert open duration step", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "open",
          duration: { type: "open" },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as {
        mesgNum: number;
        durationType: string;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.durationType).toBe(fitDurationTypeSchema.enum.open);
    });

    it("should convert workout step with equipment", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
          equipment: "swim_fins",
        },
      ];
      const workout = buildWorkout.build({ steps, subSport: undefined });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as {
        mesgNum: number;
        equipment: string;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.equipment).toBe("swimFins");
    });

    it("should omit equipment when undefined", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
          equipment: undefined,
        },
      ];
      const workout = buildWorkout.build({ steps, subSport: undefined });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).not.toHaveProperty("equipment");
    });
  });

  describe("target conversion", () => {
    it("should convert power target in watts", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 250 },
          },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as {
        mesgNum: number;
        targetType: string;
        targetValue: number;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      // Garmin encoding: 250 watts = 1250 (250 + 1000 offset)
      expect(stepMsg.targetType).toBe("power");
      expect(stepMsg.targetValue).toBe(1250);
    });

    it("should convert power target in percent FTP", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "percent_ftp", value: 85 },
          },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as {
        mesgNum: number;
        targetType: string;
        targetValue: number;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      // Garmin encoding: 85% FTP = 85 (no offset for percentages)
      expect(stepMsg.targetType).toBe("power");
      expect(stepMsg.targetValue).toBe(85);
    });

    it("should convert power zone target", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "zone", value: 3 },
          },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as {
        mesgNum: number;
        targetType: string;
        targetPowerZone: number;
      };
      const step = steps[0];
      const targetZone =
        step.target.type === "power" && step.target.value.unit === "zone"
          ? step.target.value.value
          : undefined;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.targetType).toBe("power");
      expect(stepMsg.targetPowerZone).toBe(targetZone);
    });

    it("should convert power range target", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "range", min: 200, max: 250 },
          },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as {
        mesgNum: number;
        targetType: string;
        customTargetPowerLow: number;
        customTargetPowerHigh: number;
      };
      const step = steps[0];
      const targetMin =
        step.target.type === "power" && step.target.value.unit === "range"
          ? step.target.value.min
          : undefined;
      const targetMax =
        step.target.type === "power" && step.target.value.unit === "range"
          ? step.target.value.max
          : undefined;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.targetType).toBe("power");
      expect(stepMsg.customTargetPowerLow).toBe(targetMin);
      expect(stepMsg.customTargetPowerHigh).toBe(targetMax);
    });

    it("should convert heart rate target in bpm", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "heart_rate",
          target: {
            type: "heart_rate",
            value: { unit: "bpm", value: 150 },
          },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      // Garmin encoding: 150 bpm = 250 (150 + 100 offset)
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        targetType: "heartRate",
        targetValue: 250,
      });
    });

    it("should convert heart rate zone target", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "heart_rate",
          target: {
            type: "heart_rate",
            value: { unit: "zone", value: 4 },
          },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      const step = steps[0];
      const targetZone =
        step.target.type === "heart_rate" && step.target.value.unit === "zone"
          ? step.target.value.value
          : undefined;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        targetType: "heartRate",
        targetHrZone: targetZone,
      });
    });

    it("should convert cadence target in rpm", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "cadence",
          target: {
            type: "cadence",
            value: { unit: "rpm", value: 90 },
          },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      const step = steps[0];
      const targetValue =
        step.target.type === "cadence" && step.target.value.unit === "rpm"
          ? step.target.value.value
          : undefined;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        targetType: "cadence",
        customTargetCadenceLow: targetValue,
        customTargetCadenceHigh: targetValue,
      });
    });

    it("should convert pace target in mps", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "pace",
          target: {
            type: "pace",
            value: { unit: "mps", value: 3.5 },
          },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      const step = steps[0];
      const targetValue =
        step.target.type === "pace" && step.target.value.unit === "mps"
          ? step.target.value.value
          : undefined;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        targetType: "speed",
        customTargetSpeedLow: targetValue,
        customTargetSpeedHigh: targetValue,
      });
    });

    it("should convert open target", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.targetType).toBe("open");
    });
  });

  describe("repetition block encoding", () => {
    it("should encode repetition block with correct structure", () => {
      // Arrange
      const logger = createMockLogger();
      const repetitionBlock: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 250 },
            },
          },
          {
            stepIndex: 1,
            durationType: "time",
            duration: { type: "time", seconds: 60 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 100 },
            },
          },
        ],
      };
      const steps: Array<WorkoutStep | RepetitionBlock> = [repetitionBlock];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      expect(messages.length).toBe(5);
      const repeatMsg = messages[4] as {
        mesgNum: number;
        messageIndex: number;
        durationType: string;
        durationStep: number;
        repeatSteps: number;
        targetType: string;
      };
      expect(repeatMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(repeatMsg.durationType).toBe(
        fitDurationTypeSchema.enum.repeatUntilStepsCmplt
      );
      expect(repeatMsg.durationStep).toBe(0);
      expect(repeatMsg.repeatSteps).toBe(repetitionBlock.repeatCount);
      expect(repeatMsg.targetType).toBe("open");
    });

    it("should encode multiple repetition blocks", () => {
      // Arrange
      const logger = createMockLogger();
      const block1: RepetitionBlock = {
        repeatCount: 2,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 300 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 200 },
            },
          },
        ],
      };
      const block2: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          {
            stepIndex: 0,
            durationType: "time",
            duration: { type: "time", seconds: 180 },
            targetType: "power",
            target: {
              type: "power",
              value: { unit: "watts", value: 250 },
            },
          },
        ],
      };
      const steps: Array<WorkoutStep | RepetitionBlock> = [block1, block2];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      expect(messages.length).toBe(6);
      const repeat1Msg = messages[3] as Record<string, unknown>;
      expect(repeat1Msg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(repeat1Msg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(repeat1Msg).toMatchObject({
        repeatSteps: block1.repeatCount,
        durationStep: 0,
      });

      const repeat2Msg = messages[5] as Record<string, unknown>;
      expect(repeat2Msg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(repeat2Msg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(repeat2Msg).toMatchObject({
        repeatSteps: block2.repeatCount,
        durationStep: 2,
      });
    });
  });

  describe("error handling", () => {
    it("should throw FitParsingError when workout is missing", () => {
      // Arrange
      const logger = createMockLogger();
      const krd = buildKRD.build({
        extensions: {},
      });

      // Act & Assert
      expect(() => convertKRDToMessages(krd, logger)).toThrow(FitParsingError);
      expect(() => convertKRDToMessages(krd, logger)).toThrow(
        "KRD missing workout data in extensions"
      );
    });

    it("should throw FitParsingError when extensions is undefined", () => {
      // Arrange
      const logger = createMockLogger();
      const krd: KRD = {
        version: "1.0",
        type: "workout",
        metadata: buildKRDMetadata.build(),
      };

      // Act & Assert
      expect(() => convertKRDToMessages(krd, logger)).toThrow(FitParsingError);
    });
  });

  describe("advanced duration types - calorie-based", () => {
    it("should convert calories duration to FIT", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "calories",
          duration: { type: "calories", calories: 500 },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        messageIndex: 0,
        durationType: fitDurationTypeSchema.enum.calories,
        durationCalories: 500,
        targetType: stepMsg.targetType,
      });
    });

    it("should convert repeatUntilCalories duration to FIT", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "repeat_until_calories",
          duration: {
            type: "repeat_until_calories",
            calories: 1000,
            repeatFrom: 0,
          },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilCalories,
        durationCalories: 1000,
        durationStep: 0,
        targetType: stepMsg.targetType,
      });
    });

    it("should handle boundary calorie values", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "calories",
          duration: { type: "calories", calories: 1 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "calories",
          duration: { type: "calories", calories: 10000 },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const step1Msg = messages[2] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(step1Msg.durationCalories).toBe(1);

      const step2Msg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(step2Msg.durationCalories).toBe(10000);
    });
  });

  describe("advanced duration types - power-based", () => {
    it("should convert powerLessThan duration to FIT", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "power_less_than",
          duration: { type: "power_less_than", watts: 200 },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        messageIndex: 0,
        durationType: fitDurationTypeSchema.enum.powerLessThan,
        durationPower: 200,
        targetType: stepMsg.targetType,
      });
    });

    it("should convert powerGreaterThan duration to FIT", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "power_greater_than",
          duration: { type: "power_greater_than", watts: 250 },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        messageIndex: 0,
        durationType: fitDurationTypeSchema.enum.powerGreaterThan,
        durationPower: 250,
        targetType: stepMsg.targetType,
      });
    });

    it("should convert repeatUntilPowerLessThan duration to FIT", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "repeat_until_power_less_than",
          duration: {
            type: "repeat_until_power_less_than",
            watts: 180,
            repeatFrom: 0,
          },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilPowerLessThan,
        durationPower: 180,
        durationStep: 0,
        targetType: stepMsg.targetType,
      });
    });

    it("should convert repeatUntilPowerGreaterThan duration to FIT", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "repeat_until_power_greater_than",
          duration: {
            type: "repeat_until_power_greater_than",
            watts: 300,
            repeatFrom: 0,
          },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilPowerGreaterThan,
        durationPower: 300,
        durationStep: 0,
        targetType: stepMsg.targetType,
      });
    });

    it("should handle boundary power values", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "power_less_than",
          duration: { type: "power_less_than", watts: 50 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "power_greater_than",
          duration: { type: "power_greater_than", watts: 1000 },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const step1Msg = messages[2] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(step1Msg.durationPower).toBe(50);

      const step2Msg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(step2Msg.durationPower).toBe(1000);
    });
  });

  describe("advanced duration types - repeat conditionals", () => {
    it("should convert repeatUntilTime duration to FIT", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "repeat_until_time",
          duration: {
            type: "repeat_until_time",
            seconds: 1800,
            repeatFrom: 0,
          },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilTime,
        durationTime: 1800,
        durationStep: 0,
        targetType: stepMsg.targetType,
      });
    });

    it("should convert repeatUntilDistance duration to FIT", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "distance",
          duration: { type: "distance", meters: 1000 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "repeat_until_distance",
          duration: {
            type: "repeat_until_distance",
            meters: 5000,
            repeatFrom: 0,
          },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilDistance,
        durationDistance: 5000,
        durationStep: 0,
        targetType: stepMsg.targetType,
      });
    });

    it("should convert repeatUntilHrLessThan duration to FIT", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "repeat_until_heart_rate_less_than",
          duration: {
            type: "repeat_until_heart_rate_less_than",
            bpm: 120,
            repeatFrom: 0,
          },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilHrLessThan,
        durationHr: 120,
        durationStep: 0,
        targetType: stepMsg.targetType,
      });
    });

    it("should handle multiple repeat conditionals in sequence", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "repeat_until_time",
          duration: {
            type: "repeat_until_time",
            seconds: 600,
            repeatFrom: 0,
          },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 2,
          durationType: "distance",
          duration: { type: "distance", meters: 1000 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 3,
          durationType: "repeat_until_distance",
          duration: {
            type: "repeat_until_distance",
            meters: 3000,
            repeatFrom: 2,
          },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      expect(messages.length).toBe(6);

      const step2Msg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(step2Msg).toMatchObject({
        durationType: fitDurationTypeSchema.enum.repeatUntilTime,
        durationTime: 600,
        durationStep: 0,
      });

      const step4Msg = messages[5] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(step4Msg).toMatchObject({
        durationType: fitDurationTypeSchema.enum.repeatUntilDistance,
        durationDistance: 3000,
        durationStep: 2,
      });
    });
  });

  describe("advanced duration types - dynamic field mapping", () => {
    it("should map durationCalories field correctly", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "calories",
          duration: { type: "calories", calories: 750 },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toHaveProperty("durationCalories");
      expect(stepMsg).not.toHaveProperty("durationTime");
      expect(stepMsg).not.toHaveProperty("durationDistance");
      expect(stepMsg).not.toHaveProperty("durationPower");
      expect(stepMsg).not.toHaveProperty("durationHr");
    });

    it("should map durationPower field correctly", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "power_less_than",
          duration: { type: "power_less_than", watts: 225 },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toHaveProperty("durationPower");
      expect(stepMsg).not.toHaveProperty("durationTime");
      expect(stepMsg).not.toHaveProperty("durationDistance");
      expect(stepMsg).not.toHaveProperty("durationCalories");
      expect(stepMsg).not.toHaveProperty("durationHr");
    });

    it("should map durationStep field for repeat conditionals", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "repeat_until_calories",
          duration: {
            type: "repeat_until_calories",
            calories: 800,
            repeatFrom: 0,
          },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(stepMsg).toHaveProperty("durationStep");
      expect(stepMsg.durationStep).toBe(0);
    });

    it("should not include durationStep for non-repeat durations", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "calories",
          duration: { type: "calories", calories: 500 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "power_less_than",
          duration: { type: "power_less_than", watts: 200 },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const step1Msg = messages[2] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(step1Msg).not.toHaveProperty("durationStep");

      const step2Msg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(step2Msg).not.toHaveProperty("durationStep");
    });
  });

  describe("advanced duration types - edge cases", () => {
    it("should reject zero calorie values due to schema validation", () => {
      // Arrange - Zero calories is invalid per schema (positive required)
      const logger = createMockLogger();
      const workout = {
        name: "Test",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "calories",
            duration: { type: "calories", calories: 0 },
            targetType: "open",
            target: { type: "open" },
          },
        ],
      };
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act & Assert
      expect(() => convertKRDToMessages(krd, logger)).toThrow(/calories/i);
    });

    it("should handle minimum positive calorie values", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "calories",
          duration: { type: "calories", calories: 1 },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.durationCalories).toBe(1);
    });

    it("should reject zero power values due to schema validation", () => {
      // Arrange - Zero power is invalid per schema (positive required)
      const logger = createMockLogger();
      const workout = {
        name: "Test",
        sport: "cycling",
        steps: [
          {
            stepIndex: 0,
            durationType: "power_less_than",
            duration: { type: "power_less_than", watts: 0 },
            targetType: "open",
            target: { type: "open" },
          },
        ],
      };
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act & Assert
      expect(() => convertKRDToMessages(krd, logger)).toThrow(/watts/i);
    });

    it("should handle minimum positive power values", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "power_less_than",
          duration: { type: "power_less_than", watts: 1 },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.durationPower).toBe(1);
    });

    it("should handle repeatFrom index 0", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "repeat_until_time",
          duration: {
            type: "repeat_until_time",
            seconds: 600,
            repeatFrom: 0,
          },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(stepMsg.durationStep).toBe(0);
    });

    it("should handle large repeatFrom index", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 1,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 2,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
        },
        {
          stepIndex: 3,
          durationType: "repeat_until_distance",
          duration: {
            type: "repeat_until_distance",
            meters: 10000,
            repeatFrom: 0,
          },
          targetType: "open",
          target: { type: "open" },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[5] as {
        mesgNum: number;
        messageIndex: number;
      };
      expect(stepMsg.durationStep).toBe(0);
    });
  });

  describe("logging", () => {
    it("should log debug message when conversion starts", () => {
      // Arrange
      const logger = createMockLogger();
      const debugSpy = vi.spyOn(logger, "debug");
      const krd = buildKRD.build({
        extensions: {
          workout: buildWorkout.build(),
        },
      });

      // Act
      convertKRDToMessages(krd, logger);

      // Assert
      expect(debugSpy).toHaveBeenCalledWith("Converting KRD to FIT messages");
    });

    it("should log debug message with message count", () => {
      // Arrange
      const logger = createMockLogger();
      const debugSpy = vi.spyOn(logger, "debug");
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "watts", value: 200 },
          },
        },
      ];
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      convertKRDToMessages(krd, logger);

      // Assert
      expect(debugSpy).toHaveBeenCalledWith(
        "Converted KRD to FIT messages",
        expect.objectContaining({
          messageCount: expect.any(Number),
        })
      );
    });
  });
});
