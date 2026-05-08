import type { WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { PACE_M_PER_S } from "../../test-utils/constants";
import type { PaceZoneTable } from "../mappers/target.converter";
import { mapWorkoutStep } from "./garmin-workout-step.converter";

const buildWorkoutStep = (overrides?: Partial<WorkoutStep>): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 60 },
  targetType: "open",
  target: { type: "open" },
  intensity: "active",
  ...overrides,
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
      expect(result.targetValueOne).toBe(PACE_M_PER_S.Z3_MIN);
      expect(result.targetValueTwo).toBe(PACE_M_PER_S.Z3_MAX);
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
});
