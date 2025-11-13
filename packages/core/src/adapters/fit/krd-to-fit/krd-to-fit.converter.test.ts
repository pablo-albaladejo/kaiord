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
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
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
        type: fitMessageKeySchema.enum.fileIdMesgs,
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
        subSport: undefined,
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
        type: fitMessageKeySchema.enum.workoutMesgs,
        workoutMesg: {
          wktName: workout.name,
          sport: workout.sport,
          numValidSteps: workoutMsg.workoutMesg.numValidSteps,
        },
      });
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
        type: string;
        workoutMesg: Record<string, unknown>;
      };
      expect(workoutMsg).toStrictEqual({
        type: fitMessageKeySchema.enum.workoutMesgs,
        workoutMesg: {
          wktName: workout.name,
          sport: workout.sport,
          subSport: "trail",
          numValidSteps: workoutMsg.workoutMesg.numValidSteps,
        },
      });
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
      const workoutMsg = messages[1] as {
        type: string;
        workoutMesg: Record<string, unknown>;
      };
      expect(workoutMsg.workoutMesg).not.toHaveProperty("subSport");
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
        type: string;
        workoutMesg: Record<string, unknown>;
      };
      expect(workoutMsg.workoutMesg).toMatchObject({
        poolLength: 25,
        poolLengthUnit: 0,
      });
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
      const workoutMsg = messages[1] as {
        type: string;
        workoutMesg: Record<string, unknown>;
      };
      expect(workoutMsg.workoutMesg).not.toHaveProperty("poolLength");
      expect(workoutMsg.workoutMesg).not.toHaveProperty("poolLengthUnit");
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
      const workout = buildWorkout.build({ steps, subSport: undefined });
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
      // Garmin encoding: 200 watts = 1200 (200 + 1000 offset)
      expect(stepMsg).toStrictEqual({
        type: fitMessageKeySchema.enum.workoutStepMesgs,
        workoutStepMesg: {
          messageIndex: step.stepIndex,
          durationType: fitDurationTypeSchema.enum.time,
          durationTime:
            step.duration.type === "time" ? step.duration.seconds : undefined,
          targetType: stepMsg.workoutStepMesg.targetType,
          targetValue: 1200,
        },
      });
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toMatchObject({
        notes: "Focus on form and breathing",
      });
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).not.toHaveProperty("notes");
    });

    it("should truncate notes exceeding 256 characters", () => {
      // Arrange
      const logger = createMockLogger();
      const longNotes = "a".repeat(300);
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
          notes: longNotes,
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg.notes).toBe("a".repeat(256));
      expect((stepMsg.workoutStepMesg.notes as string).length).toBe(256);
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
        durationType: fitDurationTypeSchema.enum.distance,
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
      expect(stepMsg.workoutStepMesg.durationType).toBe(
        fitDurationTypeSchema.enum.open
      );
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toMatchObject({
        equipment: "swimFins",
      });
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).not.toHaveProperty("equipment");
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
      // Garmin encoding: 250 watts = 1250 (250 + 1000 offset)
      expect(stepMsg.workoutStepMesg).toMatchObject({
        targetType: "power",
        targetValue: 1250,
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
      // Garmin encoding: 85% FTP = 85 (no offset for percentages)
      expect(stepMsg.workoutStepMesg).toMatchObject({
        targetType: "power",
        targetValue: 85,
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
      // Garmin encoding: 150 bpm = 250 (150 + 100 offset)
      expect(stepMsg.workoutStepMesg).toMatchObject({
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
        type: fitMessageKeySchema.enum.workoutStepMesgs,
        workoutStepMesg: {
          messageIndex: repeatMsg.workoutStepMesg.messageIndex,
          durationType: fitDurationTypeSchema.enum.repeatUntilStepsCmplt,
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toStrictEqual({
        messageIndex: 0,
        durationType: fitDurationTypeSchema.enum.calories,
        durationCalories: 500,
        targetType: stepMsg.workoutStepMesg.targetType,
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toStrictEqual({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilCalories,
        durationCalories: 1000,
        durationStep: 0,
        targetType: stepMsg.workoutStepMesg.targetType,
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(step1Msg.workoutStepMesg.durationCalories).toBe(1);

      const step2Msg = messages[3] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(step2Msg.workoutStepMesg.durationCalories).toBe(10000);
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toStrictEqual({
        messageIndex: 0,
        durationType: fitDurationTypeSchema.enum.powerLessThan,
        durationPower: 200,
        targetType: stepMsg.workoutStepMesg.targetType,
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toStrictEqual({
        messageIndex: 0,
        durationType: fitDurationTypeSchema.enum.powerGreaterThan,
        durationPower: 250,
        targetType: stepMsg.workoutStepMesg.targetType,
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toStrictEqual({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilPowerLessThan,
        durationPower: 180,
        durationStep: 0,
        targetType: stepMsg.workoutStepMesg.targetType,
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toStrictEqual({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilPowerGreaterThan,
        durationPower: 300,
        durationStep: 0,
        targetType: stepMsg.workoutStepMesg.targetType,
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(step1Msg.workoutStepMesg.durationPower).toBe(50);

      const step2Msg = messages[3] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(step2Msg.workoutStepMesg.durationPower).toBe(1000);
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toStrictEqual({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilTime,
        durationTime: 1800,
        durationStep: 0,
        targetType: stepMsg.workoutStepMesg.targetType,
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toStrictEqual({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilDistance,
        durationDistance: 5000,
        durationStep: 0,
        targetType: stepMsg.workoutStepMesg.targetType,
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toStrictEqual({
        messageIndex: 1,
        durationType: fitDurationTypeSchema.enum.repeatUntilHrLessThan,
        durationHr: 120,
        durationStep: 0,
        targetType: stepMsg.workoutStepMesg.targetType,
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(step2Msg.workoutStepMesg).toMatchObject({
        durationType: fitDurationTypeSchema.enum.repeatUntilTime,
        durationTime: 600,
        durationStep: 0,
      });

      const step4Msg = messages[5] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(step4Msg.workoutStepMesg).toMatchObject({
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toHaveProperty("durationCalories");
      expect(stepMsg.workoutStepMesg).not.toHaveProperty("durationTime");
      expect(stepMsg.workoutStepMesg).not.toHaveProperty("durationDistance");
      expect(stepMsg.workoutStepMesg).not.toHaveProperty("durationPower");
      expect(stepMsg.workoutStepMesg).not.toHaveProperty("durationHr");
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
      const stepMsg = messages[2] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toHaveProperty("durationPower");
      expect(stepMsg.workoutStepMesg).not.toHaveProperty("durationTime");
      expect(stepMsg.workoutStepMesg).not.toHaveProperty("durationDistance");
      expect(stepMsg.workoutStepMesg).not.toHaveProperty("durationCalories");
      expect(stepMsg.workoutStepMesg).not.toHaveProperty("durationHr");
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg).toHaveProperty("durationStep");
      expect(stepMsg.workoutStepMesg.durationStep).toBe(0);
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(step1Msg.workoutStepMesg).not.toHaveProperty("durationStep");

      const step2Msg = messages[3] as {
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(step2Msg.workoutStepMesg).not.toHaveProperty("durationStep");
    });
  });

  describe("advanced duration types - edge cases", () => {
    it("should handle zero calorie values", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "calories",
          duration: { type: "calories", calories: 0 },
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
      expect(stepMsg.workoutStepMesg.durationCalories).toBe(0);
    });

    it("should handle zero power values", () => {
      // Arrange
      const logger = createMockLogger();
      const steps: Array<WorkoutStep> = [
        {
          stepIndex: 0,
          durationType: "power_less_than",
          duration: { type: "power_less_than", watts: 0 },
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
      expect(stepMsg.workoutStepMesg.durationPower).toBe(0);
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg.durationStep).toBe(0);
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
        type: string;
        workoutStepMesg: Record<string, unknown>;
      };
      expect(stepMsg.workoutStepMesg.durationStep).toBe(0);
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
