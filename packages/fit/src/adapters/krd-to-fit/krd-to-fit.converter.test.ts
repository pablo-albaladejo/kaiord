import type { KRD } from "@kaiord/core";
import type { RepetitionBlock, WorkoutStep } from "@kaiord/core";
import { FitParsingError } from "@kaiord/core";
import { buildKRD } from "@kaiord/core/test-utils";
import { buildKRDMetadata } from "@kaiord/core/test-utils";
import { buildWorkoutStep } from "@kaiord/core/test-utils";
import { buildWorkout } from "@kaiord/core/test-utils";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import {
  FIT_DURATION_VALUE_1000,
  FIT_NOTES_MAX_LENGTH,
  FIT_NOTES_OVERSIZED_LENGTH,
  FIT_POOL_LENGTH_25,
  FIT_REPEATED_MESSAGES_5,
  FIT_REPEATED_MESSAGES_6,
  FIT_STEPS_COUNT_4,
  FIT_TARGET_VALUE_1200,
  FIT_TARGET_VALUE_1250,
} from "../../test-utils/constants";
import { fitDurationTypeSchema } from "../schemas/fit-duration";
import { FIT_FILE_TYPE_TO_NUMBER } from "../schemas/fit-file-type";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import { convertKRDToMessages } from "./krd-to-fit.converter";

describe("convertKRDToMessages", () => {
  describe("metadata conversion", () => {
    it("should convert KRD metadata to file_id message", () => {
      // Arrange
      const logger = createMockLogger();
      const krd = buildKRD.build({
        type: "structured_workout" as const,
        metadata: buildKRDMetadata.build({
          created: "2025-01-15T10:30:00.000Z",
          manufacturer: "garmin",
          product: "fenix7",
          serialNumber: "1234567890",
          sport: "cycling",
        }),
        extensions: {
          structured_workout: buildWorkout.build({ sport: "cycling" }),
        },
      });
      const messages = convertKRDToMessages(krd, logger);
      expect(messages.length).toBeGreaterThan(0);

      // Act
      const fileIdMsg = messages[0] as {
        mesgNum: number;
        type: number;
        manufacturer: string;
        serialNumber: number;
        timeCreated: Date;
      };

      // Assert
      expect(fileIdMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.FILE_ID);
      expect(fileIdMsg.type).toBe(FIT_FILE_TYPE_TO_NUMBER.workout);
      expect(fileIdMsg.manufacturer).toBe(krd.metadata.manufacturer);
      expect(fileIdMsg.serialNumber).toBe(Number(krd.metadata.serialNumber));
      expect(fileIdMsg.timeCreated).toBeInstanceOf(Date);
      expect(fileIdMsg.timeCreated.toISOString()).toBe(krd.metadata.created);
    });

    it("should use default manufacturer when not provided", () => {
      // Arrange
      const logger = createMockLogger();
      const krd = buildKRD.build({
        type: "structured_workout" as const,
        metadata: buildKRDMetadata.build({
          manufacturer: undefined,
        }),
        extensions: {
          structured_workout: buildWorkout.build(),
        },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const fileIdMsg = messages[0] as {
        mesgNum: number;
        manufacturer: string;
      };

      // Assert
      expect(fileIdMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.FILE_ID);
      expect(fileIdMsg.manufacturer).toBe("garmin");
    });

    it("should convert created timestamp to Date object", () => {
      // Arrange
      const logger = createMockLogger();
      const krd = buildKRD.build({
        type: "structured_workout" as const,
        metadata: buildKRDMetadata.build({
          created: "2025-01-15T10:30:00.000Z",
        }),
        extensions: {
          structured_workout: buildWorkout.build(),
        },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const fileIdMsg = messages[0] as {
        mesgNum: number;
        timeCreated: Date;
      };

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const workoutMsg = messages[1] as {
        mesgNum: number;
        wktName: string;
        sport: string;
        numValidSteps: number;
      };

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const workoutMsg = messages[1] as {
        mesgNum: number;
        wktName: string;
        sport: string;
        subSport: string;
        numValidSteps: number;
      };

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const workoutMsg = messages[1] as Record<string, unknown>;

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const workoutMsg = messages[1] as {
        mesgNum: number;
        poolLength: number;
        poolLengthUnit: number;
      };

      // Assert
      expect(workoutMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT);
      expect(workoutMsg.poolLength).toBe(FIT_POOL_LENGTH_25);
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const workoutMsg = messages[1] as Record<string, unknown>;

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const workoutMsg = messages[1] as {
        mesgNum: number;
        numValidSteps: number;
      };

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const workoutMsg = messages[1] as {
        mesgNum: number;
        numValidSteps: number;
      };

      // Assert
      expect(workoutMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT);
      expect(workoutMsg.numValidSteps).toBe(FIT_STEPS_COUNT_4);
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);
      const stepMsg = messages[2] as {
        mesgNum: number;
        messageIndex: number;
        durationType: string;
        durationTime: number;
        durationValue: number;
        targetType: string;
        targetValue: number;
      };

      // Act
      const step = steps[0];

      // Assert
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.messageIndex).toBe(step.stepIndex);
      expect(stepMsg.durationType).toBe(fitDurationTypeSchema.enum.time);
      expect(stepMsg.durationTime).toBe(step.duration.seconds);
      expect(stepMsg.durationValue).toBe(
        step.duration.seconds * FIT_DURATION_VALUE_1000
      );
      expect(stepMsg.targetType).toBe("power");
      expect(stepMsg.targetValue).toBe(FIT_TARGET_VALUE_1200);
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const stepMsg = messages[2] as {
        mesgNum: number;
        notes: string;
      };

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const stepMsg = messages[2] as Record<string, unknown>;

      // Assert
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).not.toHaveProperty("notes");
    });

    it("should throw on notes exceeding 256 characters due to schema validation", () => {
      // Arrange
      const logger = createMockLogger();
      const longNotes = "a".repeat(FIT_NOTES_OVERSIZED_LENGTH);
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

      // Act
      const krd = buildKRD.build({
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });

      // Assert
      expect(() => convertKRDToMessages(krd, logger)).toThrow(/notes.*256/i);
    });

    it("should accept notes at exactly 256 characters", () => {
      // Arrange
      const logger = createMockLogger();
      const maxNotes = "a".repeat(FIT_NOTES_MAX_LENGTH);
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const stepMsg = messages[2] as {
        mesgNum: number;
        notes: string;
      };

      // Assert
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.notes).toBe(maxNotes);
      expect(stepMsg.notes.length).toBe(FIT_NOTES_MAX_LENGTH);
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);
      const stepMsg = messages[2] as Record<string, unknown>;
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);

      // Act
      const step = steps[0];

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const stepMsg = messages[2] as {
        mesgNum: number;
        durationType: string;
      };

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const stepMsg = messages[2] as {
        mesgNum: number;
        equipment: string;
      };

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const stepMsg = messages[2] as Record<string, unknown>;

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const stepMsg = messages[2] as {
        mesgNum: number;
        targetType: string;
        targetValue: number;
      };

      // Assert
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg.targetType).toBe("power");
      expect(stepMsg.targetValue).toBe(FIT_TARGET_VALUE_1250);
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const stepMsg = messages[2] as Record<string, unknown>;

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);
      expect(messages.length).toBe(FIT_REPEATED_MESSAGES_5);

      // Act
      const repeatMsg = messages[4] as {
        mesgNum: number;
        messageIndex: number;
        durationType: string;
        durationStep: number;
        repeatSteps: number;
        targetType: string;
      };

      // Assert
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);
      expect(messages.length).toBe(FIT_REPEATED_MESSAGES_6);
      const repeat1Msg = messages[3] as Record<string, unknown>;
      expect(repeat1Msg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(repeat1Msg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(repeat1Msg).toMatchObject({
        repeatSteps: block1.repeatCount,
        durationStep: 0,
      });

      // Act
      const repeat2Msg = messages[5] as Record<string, unknown>;

      // Assert
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

      // Act
      const krd = buildKRD.build({
        extensions: {},
      });

      // Assert
      expect(() => convertKRDToMessages(krd, logger)).toThrow(FitParsingError);
      expect(() => convertKRDToMessages(krd, logger)).toThrow(
        "KRD missing workout data in extensions"
      );
    });

    it("should throw FitParsingError when extensions is undefined", () => {
      // Arrange
      const logger = createMockLogger();

      // Act
      const krd: KRD = {
        version: "1.0",
        type: "structured_workout",
        metadata: buildKRDMetadata.build(),
      };

      // Assert
      expect(() => convertKRDToMessages(krd, logger)).toThrow(FitParsingError);
    });
  });

  describe("advanced duration types", () => {
    it("should encode a simple advanced duration step", () => {
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const stepMsg = messages[2] as Record<string, unknown>;

      // Assert
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        messageIndex: 0,
        durationType: fitDurationTypeSchema.enum.calories,
        durationCalories: 500,
        targetType: stepMsg.targetType,
      });
    });

    it("should encode a repeat-conditional duration step with its repeat index", () => {
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
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });
      const messages = convertKRDToMessages(krd, logger);

      // Act
      const stepMsg = messages[3] as {
        mesgNum: number;
        messageIndex: number;
      };

      // Assert
      expect(stepMsg.mesgNum).toBe(FIT_MESSAGE_NUMBERS.WORKOUT_STEP);
      expect(stepMsg).toMatchObject({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilTime,
        durationTime: 1800,
        durationStep: 0,
        targetType: stepMsg.targetType,
      });
    });
  });

  describe("advanced duration types - edge cases", () => {
    it("should reject zero calorie values due to schema validation", () => {
      // Arrange
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

      // Act
      const krd = buildKRD.build({
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });

      // Assert
      expect(() => convertKRDToMessages(krd, logger)).toThrow(/calories/i);
    });

    it("should reject zero power values due to schema validation", () => {
      // Arrange
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

      // Act
      const krd = buildKRD.build({
        type: "structured_workout" as const,
        extensions: { structured_workout: workout },
      });

      // Assert
      expect(() => convertKRDToMessages(krd, logger)).toThrow(/watts/i);
    });
  });
});
