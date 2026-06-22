import { describe, expect, it } from "vitest";

import { FLOOR_KCAL } from "./goal-delta";
import {
  computePeriodizedTarget,
  type ComputePeriodizedTargetInput,
} from "./periodized-target";

const BMR_KCAL = 1750;
const ACTIVITY_KCAL = 450;
const SURPLUS_DELTA = 300;
const DEFICIT_DELTA = -600;
const FLAT_DEFICIT = -400;
const HIGH_ACTIVITY_KCAL = 500;
const LOW_BMR_KCAL = 1300;
const DEEP_DEFICIT = -800;
const CUSTOM_FLOOR = 1500;
const CUSTOM_FLOOR_BMR = 1400;
const CUSTOM_FLOOR_DELTA = -900;

const baseInput = (
  overrides: Partial<ComputePeriodizedTargetInput>
): ComputePeriodizedTargetInput => ({
  bmrKcal: BMR_KCAL,
  expectedActivityKcal: 0,
  dailyDeltaKcal: 0,
  ...overrides,
});

describe("computePeriodizedTarget", () => {
  it("should sum bmr, activity, and a positive delta", () => {
    // Arrange
    const input = baseInput({
      expectedActivityKcal: ACTIVITY_KCAL,
      dailyDeltaKcal: SURPLUS_DELTA,
    });

    // Act
    const result = computePeriodizedTarget(input);

    // Assert
    expect(result).toBe(BMR_KCAL + ACTIVITY_KCAL + SURPLUS_DELTA);
  });

  it("should subtract a negative (deficit) delta from expenditure", () => {
    // Arrange
    const input = baseInput({
      expectedActivityKcal: HIGH_ACTIVITY_KCAL,
      dailyDeltaKcal: DEFICIT_DELTA,
    });

    // Act
    const result = computePeriodizedTarget(input);

    // Assert
    expect(result).toBe(BMR_KCAL + HIGH_ACTIVITY_KCAL + DEFICIT_DELTA);
  });

  it("should yield a flat target when expectedActivityKcal is zero (pre-Phase-4)", () => {
    // Arrange
    const input = baseInput({
      expectedActivityKcal: 0,
      dailyDeltaKcal: FLAT_DEFICIT,
    });

    // Act
    const result = computePeriodizedTarget(input);

    // Assert
    expect(result).toBe(BMR_KCAL + FLAT_DEFICIT);
  });

  it("should never drop below the default FLOOR_KCAL", () => {
    // Arrange
    const input = baseInput({
      bmrKcal: LOW_BMR_KCAL,
      dailyDeltaKcal: DEEP_DEFICIT,
    });

    // Act
    const result = computePeriodizedTarget(input);

    // Assert
    expect(result).toBe(FLOOR_KCAL);
  });

  it("should honor a custom floor when provided", () => {
    // Arrange
    const input = baseInput({
      bmrKcal: CUSTOM_FLOOR_BMR,
      dailyDeltaKcal: CUSTOM_FLOOR_DELTA,
      floorKcal: CUSTOM_FLOOR,
    });

    // Act
    const result = computePeriodizedTarget(input);

    // Assert
    expect(result).toBe(CUSTOM_FLOOR);
  });

  it("should throw for a non-finite bmr value", () => {
    // Arrange
    const input = baseInput({ bmrKcal: Number.POSITIVE_INFINITY });

    // Act
    const act = () => computePeriodizedTarget(input);

    // Assert
    expect(act).toThrow(RangeError);
  });
});
