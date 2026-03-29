import { describe, expect, it } from "vitest";
import { mapWorkoutStep } from "./garmin-workout-step.converter";
import type { WorkoutStep } from "@kaiord/core";
import type { PaceZoneTable } from "../mappers/target.mapper";

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
      const step = buildWorkoutStep({
        targetType: "pace",
        target: { type: "pace", value: { unit: "zone", value: 3 } },
      });

      const result = mapWorkoutStep(step, { value: 1 }, { paceZones });

      expect(result.targetValueOne).toBe(3.08);
      expect(result.targetValueTwo).toBe(3.51);
      expect(result.zoneNumber).toBeNull();
    });

    it("should throw for pace zone without paceZones", () => {
      const step = buildWorkoutStep({
        targetType: "pace",
        target: { type: "pace", value: { unit: "zone", value: 3 } },
      });

      expect(() => mapWorkoutStep(step, { value: 1 })).toThrow(
        /pace zone .* require/i
      );
    });
  });
});
