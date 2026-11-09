import type { WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  encodeRampPowerTarget,
  encodeSteadyStatePowerTarget,
} from "./power-encoder";

const makeStep = (target: WorkoutStep["target"]): WorkoutStep => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds: 60 },
  targetType: target.type,
  target,
});

// Expected values are the exact doubles the encoder has always written
// (watts / 250 * 100, then / 100). They are NOT equal to watts / 250
// (e.g. 7 / 250 === 0.028), so any "simplification" changes the XML.
const CASES = [
  { watts: 7, fraction: 0.028000000000000004 },
  { watts: 13, fraction: 0.052000000000000005 },
  { watts: 14, fraction: 0.05600000000000001 },
] as const;

describe("power-encoder watts float precision", () => {
  it.each(CASES)(
    "should write steady-state $watts W as @_Power $fraction",
    ({ watts, fraction }) => {
      // Arrange
      const step = makeStep({
        type: "power",
        value: { unit: "watts", value: watts },
      });
      const interval: Record<string, unknown> = {};

      // Act
      encodeSteadyStatePowerTarget(step, interval);

      // Assert
      expect(interval["@_Power"]).toBe(fraction);
    }
  );

  it.each(CASES)(
    "should write ramp $watts W as PowerLow and PowerHigh $fraction",
    ({ watts, fraction }) => {
      // Arrange
      const step = makeStep({
        type: "power",
        value: { unit: "range", min: watts, max: watts, basis: "watts" },
      });
      const interval: Record<string, unknown> = {};

      // Act
      encodeRampPowerTarget(step, interval);

      // Assert
      expect(interval["@_PowerLow"]).toBe(fraction);
      expect(interval["@_PowerHigh"]).toBe(fraction);
    }
  );
});
