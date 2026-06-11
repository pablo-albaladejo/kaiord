import type { WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { convertCadenceTarget } from "./krd-to-fit-target-cadence.converter";

const cadenceStep = (
  value:
    | { unit: "rpm"; value: number }
    | { unit: "range"; min: number; max: number }
): WorkoutStep => ({
  stepIndex: 0,
  durationType: "open",
  duration: { type: "open" },
  targetType: "cadence",
  target: { type: "cadence", value },
});

describe("convertCadenceTarget", () => {
  it("should map a cadence range to custom low and high", () => {
    // Arrange
    const message: Record<string, unknown> = {};
    const step = cadenceStep({ unit: "range", min: 85, max: 95 });

    // Act
    convertCadenceTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "cadence",
      targetValue: 0,
      customTargetCadenceLow: 85,
      customTargetCadenceHigh: 95,
    });
  });

  it("should map a scalar cadence to equal low and high bounds", () => {
    // Arrange
    const message: Record<string, unknown> = {};
    const step = cadenceStep({ unit: "rpm", value: 90 });

    // Act
    convertCadenceTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "cadence",
      targetValue: 0,
      customTargetCadenceLow: 90,
      customTargetCadenceHigh: 90,
    });
  });

  it("should only set the target type for a non-cadence target", () => {
    // Arrange
    const message: Record<string, unknown> = {};
    const step: WorkoutStep = {
      stepIndex: 0,
      durationType: "open",
      duration: { type: "open" },
      targetType: "open",
      target: { type: "open" },
    };

    // Act
    convertCadenceTarget(step, message);

    // Assert
    expect(message).toStrictEqual({ targetType: "cadence" });
  });
});
