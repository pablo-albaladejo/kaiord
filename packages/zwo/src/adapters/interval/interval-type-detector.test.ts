import { describe, expect, it } from "vitest";
import { intensitySchema } from "@kaiord/core";
import { targetTypeSchema } from "@kaiord/core";
import { targetUnitSchema } from "@kaiord/core";
import type { WorkoutStep } from "@kaiord/core";
import { detectIntervalType } from "./interval-type-detector";

describe("detectIntervalType", () => {
  describe("SteadyState detection", () => {
    it("should detect SteadyState for constant percent_ftp power target", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: targetTypeSchema.enum.power,
        target: {
          type: targetTypeSchema.enum.power,
          value: { unit: targetUnitSchema.enum.percent_ftp, value: 85 },
        },
        intensity: intensitySchema.enum.active,
      };

      // Act
      const result = detectIntervalType(step);

      // Assert
      expect(result).toBe("SteadyState");
    });

    it("should detect SteadyState for constant watts power target", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: targetTypeSchema.enum.power,
        target: {
          type: targetTypeSchema.enum.power,
          value: { unit: targetUnitSchema.enum.watts, value: 250 },
        },
        intensity: intensitySchema.enum.active,
      };

      // Act
      const result = detectIntervalType(step);

      // Assert
      expect(result).toBe("SteadyState");
    });

    it("should detect SteadyState for non-power targets", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: targetTypeSchema.enum.heart_rate,
        target: {
          type: targetTypeSchema.enum.heart_rate,
          value: { unit: targetUnitSchema.enum.bpm, value: 150 },
        },
        intensity: intensitySchema.enum.active,
      };

      // Act
      const result = detectIntervalType(step);

      // Assert
      expect(result).toBe("SteadyState");
    });
  });

  describe("Warmup detection", () => {
    it("should detect Warmup for range target with warmup intensity", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 600 },
        targetType: targetTypeSchema.enum.power,
        target: {
          type: targetTypeSchema.enum.power,
          value: { unit: targetUnitSchema.enum.range, min: 50, max: 75 },
        },
        intensity: intensitySchema.enum.warmup,
      };

      // Act
      const result = detectIntervalType(step);

      // Assert
      expect(result).toBe("Warmup");
    });
  });

  describe("Cooldown detection", () => {
    it("should detect Cooldown for range target with cooldown intensity", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 600 },
        targetType: targetTypeSchema.enum.power,
        target: {
          type: targetTypeSchema.enum.power,
          value: { unit: targetUnitSchema.enum.range, min: 75, max: 50 },
        },
        intensity: intensitySchema.enum.cooldown,
      };

      // Act
      const result = detectIntervalType(step);

      // Assert
      expect(result).toBe("Cooldown");
    });
  });

  describe("Ramp detection", () => {
    it("should detect Ramp for range target with active intensity", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: targetTypeSchema.enum.power,
        target: {
          type: targetTypeSchema.enum.power,
          value: { unit: targetUnitSchema.enum.range, min: 80, max: 100 },
        },
        intensity: intensitySchema.enum.active,
      };

      // Act
      const result = detectIntervalType(step);

      // Assert
      expect(result).toBe("Ramp");
    });

    it("should detect Ramp for range target without intensity", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: targetTypeSchema.enum.power,
        target: {
          type: targetTypeSchema.enum.power,
          value: { unit: targetUnitSchema.enum.range, min: 80, max: 100 },
        },
      };

      // Act
      const result = detectIntervalType(step);

      // Assert
      expect(result).toBe("Ramp");
    });
  });

  describe("FreeRide detection", () => {
    it("should detect FreeRide for open target", () => {
      // Arrange
      const step: WorkoutStep = {
        stepIndex: 0,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: targetTypeSchema.enum.open,
        target: { type: targetTypeSchema.enum.open },
        intensity: intensitySchema.enum.active,
      };

      // Act
      const result = detectIntervalType(step);

      // Assert
      expect(result).toBe("FreeRide");
    });
  });
});
