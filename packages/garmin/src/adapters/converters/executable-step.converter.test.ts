import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import {
  NOTES_MAX_LENGTH,
  NOTES_OVERSIZED_INPUT_LENGTH,
  STEP_INDEX,
} from "../../test-utils/constants";
import type { ParsedExecutableStep } from "../schemas/garmin-workout-parse.schema";
import { mapExecutableStep } from "./executable-step.converter";

const createLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const buildStep = (
  overrides?: Partial<ParsedExecutableStep>
): ParsedExecutableStep => ({
  type: "ExecutableStepDTO",
  stepType: { stepTypeKey: "interval" },
  endCondition: { conditionTypeKey: "time" },
  endConditionValue: 300,
  targetType: { workoutTargetTypeKey: "no.target" },
  ...overrides,
});

describe("mapExecutableStep", () => {
  describe("duration mapping", () => {
    it("should map time condition to time duration", () => {
      // Arrange
      const step = buildStep({
        endCondition: { conditionTypeKey: "time" },
        endConditionValue: 600,
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.durationType).toBe("time");
      expect(result.duration).toStrictEqual({ type: "time", seconds: 600 });
    });

    it("should map distance condition to distance duration", () => {
      // Arrange
      const step = buildStep({
        endCondition: { conditionTypeKey: "distance" },
        endConditionValue: 1000,
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.durationType).toBe("distance");
      expect(result.duration).toStrictEqual({
        type: "distance",
        meters: 1000,
      });
    });

    it("should map calories condition to calories duration", () => {
      // Arrange
      const step = buildStep({
        endCondition: { conditionTypeKey: "calories" },
        endConditionValue: 500,
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.durationType).toBe("calories");
      expect(result.duration).toStrictEqual({
        type: "calories",
        calories: 500,
      });
    });

    it("should map lap.button condition to open duration", () => {
      // Arrange
      const step = buildStep({
        endCondition: { conditionTypeKey: "lap.button" },
        endConditionValue: 0,
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.durationType).toBe("open");
      expect(result.duration).toStrictEqual({ type: "open" });
    });
  });

  describe("intensity mapping", () => {
    it.each([
      ["warmup", "warmup"],
      ["cooldown", "cooldown"],
      ["interval", "active"],
      ["recovery", "recovery"],
      ["rest", "rest"],
    ])(
      "should map %s step type to %s intensity",
      (stepTypeKey, expectedIntensity) => {
        // Arrange
        const step = buildStep({
          stepType: { stepTypeKey },
        });

        // Act
        const result = mapExecutableStep(step, 0);

        // Assert
        expect(result.intensity).toBe(expectedIntensity);
      }
    );
  });

  describe("target mapping", () => {
    it("should map no.target to open target", () => {
      // Arrange
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "no.target" },
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.targetType).toBe("open");
      expect(result.target).toStrictEqual({ type: "open" });
    });

    it("should map power.zone target with zone number", () => {
      // Arrange
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "power.zone" },
        zoneNumber: 3,
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.targetType).toBe("power");
      expect(result.target).toStrictEqual({
        type: "power",
        value: { unit: "zone", value: 3 },
      });
    });

    it("should map power.zone target with range values", () => {
      // Arrange
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "power.zone" },
        targetValueOne: 200,
        targetValueTwo: 250,
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.targetType).toBe("power");
      expect(result.target).toStrictEqual({
        type: "power",
        value: { unit: "range", min: 200, max: 250 },
      });
    });

    it("should map heart.rate.zone target with zone number", () => {
      // Arrange
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "heart.rate.zone" },
        zoneNumber: 4,
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.targetType).toBe("heart_rate");
      expect(result.target).toStrictEqual({
        type: "heart_rate",
        value: { unit: "zone", value: 4 },
      });
    });

    it("should map cadence target with range values", () => {
      // Arrange
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "cadence" },
        targetValueOne: 80,
        targetValueTwo: 100,
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.targetType).toBe("cadence");
      expect(result.target).toStrictEqual({
        type: "cadence",
        value: { unit: "range", min: 80, max: 100 },
      });
    });
  });

  describe("secondary target", () => {
    it("should use secondary target when primary is open", () => {
      // Arrange
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "no.target" },
        secondaryTargetType: { workoutTargetTypeKey: "power.zone" },
        secondaryTargetValueOne: 180,
        secondaryTargetValueTwo: 220,
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.targetType).toBe("power");
      expect(result.target).toStrictEqual({
        type: "power",
        value: { unit: "range", min: 180, max: 220 },
      });
    });

    it("should not use secondary target when primary is defined", () => {
      // Arrange
      const step = buildStep({
        targetType: { workoutTargetTypeKey: "power.zone" },
        zoneNumber: 3,
        secondaryTargetType: { workoutTargetTypeKey: "heart.rate.zone" },
        secondaryZoneNumber: 4,
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.targetType).toBe("power");
      expect(result.target).toStrictEqual({
        type: "power",
        value: { unit: "zone", value: 3 },
      });
    });
  });

  describe("equipment mapping", () => {
    it("should include equipment when equipmentType is present", () => {
      // Arrange
      const step = buildStep({
        equipmentType: { equipmentTypeKey: "fins" },
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.equipment).toBe("swim_fins");
    });

    it("should not include equipment when equipmentType is absent", () => {
      // Arrange
      const step = buildStep();

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.equipment).toBeUndefined();
    });
  });

  describe("stroke mapping", () => {
    it("should override target with stroke_type when stroke is present", () => {
      // Arrange
      const step = buildStep({
        strokeType: { strokeTypeKey: "free", strokeTypeId: 6 },
        targetType: { workoutTargetTypeKey: "no.target" },
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.targetType).toBe("stroke_type");
      expect(result.target).toStrictEqual({
        type: "stroke_type",
        value: { unit: "swim_stroke", value: 0 },
      });
    });

    it("should not set stroke target when strokeType has id 0", () => {
      // Arrange
      const step = buildStep({
        strokeType: { strokeTypeKey: "free", strokeTypeId: 0 },
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.targetType).toBe("open");
    });

    it("should not set stroke target when strokeTypeKey is null", () => {
      // Arrange
      const step = buildStep({
        strokeType: { strokeTypeKey: null, strokeTypeId: 6 },
      });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.targetType).toBe("open");
    });
  });

  describe("notes mapping", () => {
    it("should map description to notes when present", () => {
      // Arrange
      const step = buildStep({ description: "RPE 8: 250W" });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.notes).toBe("RPE 8: 250W");
    });

    it("should omit notes when description is absent", () => {
      // Arrange
      const step = buildStep();

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.notes).toBeUndefined();
    });

    it("should truncate description to 256 characters", () => {
      // Arrange
      const longDescription = "A".repeat(NOTES_OVERSIZED_INPUT_LENGTH);
      const step = buildStep({ description: longDescription });

      // Act
      const result = mapExecutableStep(step, 0);

      // Assert
      expect(result.notes).toHaveLength(NOTES_MAX_LENGTH);
      expect(result.notes).toBe("A".repeat(NOTES_MAX_LENGTH));
    });
  });

  describe("stepIndex", () => {
    it("should assign the provided stepIndex", () => {
      // Arrange
      const step = buildStep();

      // Act
      const result = mapExecutableStep(step, STEP_INDEX.FIVE);

      // Assert
      expect(result.stepIndex).toBe(STEP_INDEX.FIVE);
    });
  });

  describe("lossy-conversion warnings", () => {
    it("should warn and open when end-condition is reps", () => {
      // Arrange
      const logger = createLogger();
      const step = buildStep({
        endCondition: { conditionTypeKey: "reps" },
        endConditionValue: 10,
      });

      // Act
      const result = mapExecutableStep(step, 0, logger);

      // Assert
      expect(result.durationType).toBe("open");
      expect(logger.warn).toHaveBeenCalledWith(
        "Lossy conversion: reps end-condition not supported, treating as open",
        expect.objectContaining({ conditionTypeKey: "reps" })
      );
    });

    it("should warn when end-condition is unknown", () => {
      // Arrange
      const logger = createLogger();
      const step = buildStep({
        endCondition: { conditionTypeKey: "iterations" },
        endConditionValue: 3,
      });

      // Act
      const result = mapExecutableStep(step, 0, logger);

      // Assert
      expect(result.durationType).toBe("open");
      expect(logger.warn).toHaveBeenCalledWith(
        "Lossy conversion: unknown end-condition, treating as open",
        expect.objectContaining({ conditionTypeKey: "iterations" })
      );
    });

    it("should warn when step type is unknown", () => {
      // Arrange
      const logger = createLogger();
      const step = buildStep({ stepType: { stepTypeKey: "mystery" } });

      // Act
      const result = mapExecutableStep(step, 0, logger);

      // Assert
      expect(result.intensity).toBe("active");
      expect(logger.warn).toHaveBeenCalledWith(
        "Lossy conversion: unknown Garmin step type, defaulting to active",
        expect.objectContaining({ stepTypeKey: "mystery" })
      );
    });

    it("should warn when stroke is unknown", () => {
      // Arrange
      const logger = createLogger();
      const step = buildStep({
        strokeType: { strokeTypeKey: "mystery", strokeTypeId: 99 },
      });

      // Act
      mapExecutableStep(step, 0, logger);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        "Lossy conversion: unknown Garmin stroke, dropping stroke field",
        expect.objectContaining({ strokeTypeKey: "mystery" })
      );
    });

    it("should warn when notes are truncated", () => {
      // Arrange
      const logger = createLogger();
      const longDescription = "A".repeat(NOTES_OVERSIZED_INPUT_LENGTH);
      const step = buildStep({ description: longDescription });

      // Act
      const result = mapExecutableStep(step, 0, logger);

      // Assert
      expect(result.notes).toHaveLength(NOTES_MAX_LENGTH);
      expect(logger.warn).toHaveBeenCalledWith(
        `Lossy conversion: step notes truncated to ${NOTES_MAX_LENGTH} characters`,
        expect.objectContaining({
          originalLength: NOTES_OVERSIZED_INPUT_LENGTH,
        })
      );
    });
  });
});
