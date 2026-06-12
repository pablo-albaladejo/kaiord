import type { Logger, WorkoutStep } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { PACE_M_PER_S } from "../../test-utils/constants";
import { mapWorkoutStep } from "./garmin-workout-step.converter";
import type { PaceZoneTable } from "./target-types";

const buildWorkoutStep = (overrides?: Partial<WorkoutStep>): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 60 },
  targetType: "open",
  target: { type: "open" },
  intensity: "active",
  ...overrides,
});

const createLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("mapWorkoutStep", () => {
  describe("pace zone threading", () => {
    const paceZones: PaceZoneTable = [
      { zone: 1, minMps: 2.54, maxMps: 2.86 },
      { zone: 3, minMps: 3.08, maxMps: 3.51 },
    ];

    it("should resolve pace zone when paceZones provided", () => {
      // Arrange
      const step = buildWorkoutStep({
        targetType: "pace",
        target: { type: "pace", value: { unit: "zone", value: 3 } },
      });

      // Act
      const result = mapWorkoutStep(step, { value: 1 }, { paceZones });

      // Assert
      // Pace ranges encode as (faster m/s, slower m/s) per adapter-contracts spec.
      expect(result.targetValueOne).toBe(PACE_M_PER_S.Z3_MAX);
      expect(result.targetValueTwo).toBe(PACE_M_PER_S.Z3_MIN);
      expect(result.zoneNumber).toBeNull();
    });

    it("should throw for pace zone without paceZones", () => {
      // Arrange

      // Act
      const step = buildWorkoutStep({
        targetType: "pace",
        target: { type: "pace", value: { unit: "zone", value: 3 } },
      });

      // Assert
      expect(() => mapWorkoutStep(step, { value: 1 })).toThrow(
        /pace zone .* require/i
      );
    });
  });

  describe("lossy-conversion warnings", () => {
    it("should warn when intensity is unknown", () => {
      // Arrange
      const logger = createLogger();
      const step = buildWorkoutStep({ intensity: "sprint" });

      // Act
      mapWorkoutStep(step, { value: 1 }, undefined, logger);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        "Lossy conversion: unknown intensity, defaulting to interval step type",
        expect.objectContaining({ intensity: "sprint" })
      );
    });

    it("should warn when duration type is unsupported", () => {
      // Arrange
      const logger = createLogger();
      const step = buildWorkoutStep({
        durationType: "heart_rate_less_than",
        duration: { type: "heart_rate_less_than", bpm: 150 },
      });

      // Act
      mapWorkoutStep(step, { value: 1 }, undefined, logger);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        "Lossy conversion: unknown duration type, using lap-button condition",
        expect.objectContaining({ durationType: "heart_rate_less_than" })
      );
    });
  });
});
