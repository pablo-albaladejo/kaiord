import { durationTypeSchema, intensitySchema } from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it, vi } from "vitest";

import { convertSteadyStateToKrd } from "./steady-state.converter";

describe("convertSteadyStateToKrd", () => {
  describe("duration handling", () => {
    it("should convert time duration step", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
      };

      // Act
      const result = convertSteadyStateToKrd(data);

      // Assert
      expect(result.duration.type).toBe(durationTypeSchema.enum.time);
      expect(result.stepIndex).toBe(0);
    });

    it("should convert distance duration step", () => {
      // Arrange
      const data = {
        Duration: 5000,
        durationType: "distance" as const,
        Power: 1.0,
        stepIndex: 1,
      };

      // Act
      const result = convertSteadyStateToKrd(data);

      // Assert
      expect(result.duration.type).toBe(durationTypeSchema.enum.distance);
    });

    it("should restore original duration type from kaiord extension", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
        "kaiord:originalDurationType": "heart_rate_less_than",
        "kaiord:originalDurationBpm": 150,
      };

      // Act
      const result = convertSteadyStateToKrd(data);

      // Assert
      expect(result.duration.type).toBe(
        durationTypeSchema.enum.heart_rate_less_than
      );
    });
  });

  describe("intensity handling", () => {
    it("should default intensity to active when not specified", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
      };

      // Act
      const result = convertSteadyStateToKrd(data);

      // Assert
      expect(result.intensity).toBe(intensitySchema.enum.active);
    });

    it("should use kaiord intensity when provided", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
        "kaiord:intensity": "warmup",
      };

      // Act
      const result = convertSteadyStateToKrd(data);

      // Assert
      expect(result.intensity).toBe(intensitySchema.enum.warmup);
    });

    it("should restore a representable recovery intensity round-trip", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
        "kaiord:intensity": "recovery",
      };
      const logger = createMockLogger();
      const warnSpy = vi.spyOn(logger, "warn");

      // Act
      const result = convertSteadyStateToKrd(data, logger);

      // Assert
      expect(result.intensity).toBe(intensitySchema.enum.recovery);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("should narrow a lossy unknown intensity to active with a warning", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
        "kaiord:intensity": "sprint",
      };
      const logger = createMockLogger();
      const warnSpy = vi.spyOn(logger, "warn");

      // Act
      const result = convertSteadyStateToKrd(data, logger);

      // Assert
      expect(result.intensity).toBe(intensitySchema.enum.active);
      expect(warnSpy).toHaveBeenCalledWith(
        "Lossy conversion: intensity has no Zwift equivalent, using default",
        expect.objectContaining({ originalIntensity: "sprint" })
      );
    });
  });

  describe("metadata handling", () => {
    it("should set name when kaiord:name is provided", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
        "kaiord:name": "My Step",
      };

      // Act
      const result = convertSteadyStateToKrd(data);

      // Assert
      expect(result.name).toBe("My Step");
    });

    it("should not set name when kaiord:name is absent", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
      };

      // Act
      const result = convertSteadyStateToKrd(data);

      // Assert
      expect(result.name).toBeUndefined();
    });

    it("should set equipment when kaiord:equipment is provided", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
        "kaiord:equipment": "bike",
      };

      // Act
      const result = convertSteadyStateToKrd(data);

      // Assert
      expect(result.equipment).toBe("bike");
    });
  });

  describe("text event extraction", () => {
    it("should extract single text event to notes and extensions", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
        textevent: { message: "Push hard!", timeoffset: 0 },
      };

      // Act
      const result = convertSteadyStateToKrd(data);

      // Assert
      expect(result.notes).toBe("Push hard!");
      expect(result.extensions).toStrictEqual({
        zwift: { textEvents: [{ message: "Push hard!", timeoffset: 0 }] },
      });
    });

    it("should not set notes or extensions when no text events", () => {
      // Arrange
      const data = {
        Duration: 300,
        durationType: "time" as const,
        Power: 1.0,
        stepIndex: 0,
      };

      // Act
      const result = convertSteadyStateToKrd(data);

      // Assert
      expect(result.notes).toBeUndefined();
      expect(result.extensions).toBeUndefined();
    });
  });
});

describe("convertSteadyStateToKrd power-unit extension edge", () => {
  it("should ignore a watts power-unit marker without an original watts value", () => {
    // Arrange
    const data = {
      Duration: 300,
      Power: 0.75,
      "kaiord:powerUnit": "watts",
    };

    // Act
    const result = convertSteadyStateToKrd(data, 0);

    // Assert
    expect(result.target.type).toBe("power");
    expect(result.target).not.toMatchObject({ value: { unit: "watts" } });
  });
});
