import type { WorkoutStep } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { convertPaceTarget } from "./krd-to-fit-target-pace.converter";

const paceStep = (
  value:
    | { unit: "mps"; value: number }
    | { unit: "zone"; value: number }
    | { unit: "range"; min: number; max: number }
): WorkoutStep => ({
  stepIndex: 0,
  durationType: "open",
  duration: { type: "open" },
  targetType: "pace",
  target: { type: "pace", value },
});

describe("convertPaceTarget", () => {
  it("should map a pace zone to the speed zone field", () => {
    // Arrange
    const message: Record<string, unknown> = {};
    const step = paceStep({ unit: "zone", value: 3 });

    // Act
    convertPaceTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "speed",
      targetSpeedZone: 3,
    });
  });

  it("should map a pace range to custom speed bounds", () => {
    // Arrange
    const message: Record<string, unknown> = {};
    const step = paceStep({ unit: "range", min: 3.0, max: 3.5 });

    // Act
    convertPaceTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "speed",
      targetValue: 0,
      customTargetSpeedLow: 3.0,
      customTargetSpeedHigh: 3.5,
    });
  });

  it("should map a scalar pace to equal speed bounds", () => {
    // Arrange
    const message: Record<string, unknown> = {};
    const step = paceStep({ unit: "mps", value: 4.2 });

    // Act
    convertPaceTarget(step, message);

    // Assert
    expect(message).toStrictEqual({
      targetType: "speed",
      targetValue: 0,
      customTargetSpeedLow: 4.2,
      customTargetSpeedHigh: 4.2,
    });
  });

  it("should only set the target type for a non-pace target", () => {
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
    convertPaceTarget(step, message);

    // Assert
    expect(message).toStrictEqual({ targetType: "speed" });
  });
});
