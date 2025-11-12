import { describe, expect, it, vi } from "vitest";
import type { KRD } from "../../../domain/schemas/krd";
import { RepetitionBlock, WorkoutStep } from "../../../domain/schemas/workout";
import { FitParsingError } from "../../../domain/types/errors";
import {
  buildKRD,
  buildKRDMetadata,
} from "../../../tests/fixtures/krd.fixtures";
import {
  buildWorkout,
  buildWorkoutStep,
} from "../../../tests/fixtures/workout.fixtures";
import { createMockLogger } from "../../../tests/helpers/test-utils";
import { FIT_DURATION_TYPE, FIT_MESSAGE_KEY } from "../constants";
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
        type: string;
        fileIdMesg: Record<string, unknown>;
      };
      expect(fileIdMsg).toStrictEqual({
        type: FIT_MESSAGE_KEY.FILE_ID,
        fileIdMesg: {
          type: "workout",
          manufacturer: krd.metadata.manufacturer,
          product: krd.metadata.product,
          serialNumber: Number(krd.metadata.serialNumber),
          timeCreated: fileIdMsg.fileIdMesg.timeCreated,
        },
      });
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
        type: string;
        fileIdMesg: Record<string, unknown>;
      };
      expect(fileIdMsg.fileIdMesg.manufacturer).toBe("development");
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
        type: string;
        fileIdMesg: Record<string, unknown>;
      };
      expect(fileIdMsg.fileIdMesg.timeCreated).toBeInstanceOf(Date);
      expect((fileIdMsg.fileIdMesg.timeCreated as Date).toISOString()).toBe(
        krd.metadata.created
      );
    });
  });

  describe("workout metadata conversion", () => {
    it("should convert workout metadata to workout message", () => {
      // Arrange
      const logger = createMockLogger();
      const workout = buildWorkout.build({
        name: "Test Workout",
        sport: "running",
      });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const workoutMsg = messages[1] as {
        type: string;
        workoutMesg: Record<string, unknown>;
      };
      expect(workoutMsg).toStrictEqual({
        type: FIT_MESSAGE_KEY.WORKOUT,
        workoutMesg: {
          wktName: workout.name,
          sport: workout.sport,
          numValidSteps: workoutMsg.workoutMesg.numValidSteps,
        },
      });
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
        type: string;
        workoutMesg: Record<string, unknown>;
      };
      expect(workoutMsg.workoutMesg.numValidSteps).toBe(2);
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
        type: string;
        workoutMesg: Record<string, unknown>;
      };
      expect(workoutMsg.workoutMesg.numValidSteps).toBe(4);
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
      const workout = buildWorkout.build({ steps });
      const krd = buildKRD.build({
        extensions: { workout },
      });

      // Act
      const messages = convertKRDToMessages(krd, logger);

      // Assert
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      const step = steps[0];
      expect(stepMsg).toStrictEqual({
        type: FIT_MESSAGE_KEY.WORKOUT_STEP,
        workoutStepMesg: {
          messageIndex: step.stepIndex,
          durationType: FIT_DURATION_TYPE.TIME,
          durationTime:
            step.duration.type === "time" ? step.duration.seconds : undefined,
          targetType: stepMsg.workoutStepMesg.targetType,
          targetValue: stepMsg.workoutStepMesg.targetValue,
          customTargetPowerLow: stepMsg.workoutStepMesg.customTargetPowerLow,
          customTargetPowerHigh: stepMsg.workoutStepMesg.customTargetPowerHigh,
        },
      });
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      const step = steps[0];
      expect(stepMsg.workoutStepMesg).toStrictEqual({
        messageIndex: step.stepIndex,
        durationType: FIT_DURATION_TYPE.DISTANCE,
        durationDistance:
          step.duration.type === "distance" ? step.duration.meters : undefined,
        targetType: stepMsg.workoutStepMesg.targetType,
        targetValue: stepMsg.workoutStepMesg.targetValue,
        customTargetSpeedLow: stepMsg.workoutStepMesg.customTargetSpeedLow,
        customTargetSpeedHigh: stepMsg.workoutStepMesg.customTargetSpeedHigh,
      });
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg.durationType).toBe(FIT_DURATION_TYPE.OPEN);
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      const step = steps[0];
      const targetValue =
        step.target.type === "power" && step.target.value.unit === "watts"
          ? step.target.value.value
          : undefined;
      expect(stepMsg.workoutStepMesg).toMatchObject({
        targetType: "power",
        customTargetPowerLow: targetValue,
        customTargetPowerHigh: targetValue,
      });
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      const step = steps[0];
      const targetValue =
        step.target.type === "power" && step.target.value.unit === "percent_ftp"
          ? step.target.value.value
          : undefined;
      expect(stepMsg.workoutStepMesg).toMatchObject({
        targetType: "power",
        customTargetPowerLow: targetValue,
        customTargetPowerHigh: targetValue,
      });
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      const step = steps[0];
      const targetZone =
        step.target.type === "power" && step.target.value.unit === "zone"
          ? step.target.value.value
          : undefined;
      expect(stepMsg.workoutStepMesg).toMatchObject({
        targetType: "power",
        targetPowerZone: targetZone,
      });
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
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
      expect(stepMsg.workoutStepMesg).toMatchObject({
        targetType: "power",
        customTargetPowerLow: targetMin,
        customTargetPowerHigh: targetMax,
      });
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      const step = steps[0];
      const targetValue =
        step.target.type === "heart_rate" && step.target.value.unit === "bpm"
          ? step.target.value.value
          : undefined;
      expect(stepMsg.workoutStepMesg).toMatchObject({
        targetType: "heartRate",
        customTargetHeartRateLow: targetValue,
        customTargetHeartRateHigh: targetValue,
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      const step = steps[0];
      const targetZone =
        step.target.type === "heart_rate" && step.target.value.unit === "zone"
          ? step.target.value.value
          : undefined;
      expect(stepMsg.workoutStepMesg).toMatchObject({
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      const step = steps[0];
      const targetValue =
        step.target.type === "cadence" && step.target.value.unit === "rpm"
          ? step.target.value.value
          : undefined;
      expect(stepMsg.workoutStepMesg).toMatchObject({
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      const step = steps[0];
      const targetValue =
        step.target.type === "pace" && step.target.value.unit === "mps"
          ? step.target.value.value
          : undefined;
      expect(stepMsg.workoutStepMesg).toMatchObject({
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg.targetType).toBe("open");
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(repeatMsg).toStrictEqual({
        type: FIT_MESSAGE_KEY.WORKOUT_STEP,
        workoutStepMesg: {
          messageIndex: repeatMsg.workoutStepMesg.messageIndex,
          durationType: FIT_DURATION_TYPE.REPEAT_UNTIL_STEPS_COMPLETE,
          durationStep: 0,
          repeatSteps: repetitionBlock.repeatCount,
          targetType: repeatMsg.workoutStepMesg.targetType,
        },
      });
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
      const repeat1Msg = messages[3] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(repeat1Msg.workoutStepMesg).toMatchObject({
        repeatSteps: block1.repeatCount,
        durationStep: 0,
      });

      const repeat2Msg = messages[5] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(repeat2Msg.workoutStepMesg).toMatchObject({
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
