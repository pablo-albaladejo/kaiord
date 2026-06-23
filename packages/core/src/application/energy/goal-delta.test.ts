import { describe, expect, it } from "vitest";

import {
  computeDailyDelta,
  type ComputeDailyDeltaInput,
  FLOOR_KCAL,
  MUSCLE_SURPLUS_CAP,
} from "./goal-delta";

const TODAY = "2026-01-01";
const TARGET_90D = "2026-04-01";
const TARGET_30D = "2026-01-31";
const KCAL_PER_KG = 7700;
const DAYS_90 = 90;
const DAYS_30 = 30;
const PRECISION = 4;
const DEFAULT_WEIGHT_KG = 80;
const DEFAULT_TARGET_KG = 75;
const DEFAULT_MAINTENANCE = 2500;
const MAX_WEEKLY_LOSS_FRACTION = 0.0075;
const DAYS_PER_WEEK = 7;
const LOW_MAINTENANCE = 1500;
const AGGRESSIVE_TARGET_KG = 70;
const MUSCLE_START_KG = 75;
const MUSCLE_TARGET_KG = 76;
const MUSCLE_AGGRESSIVE_TARGET_KG = 75;
const ONE_KG = 1;

const rateCapKcal = (currentWeightKg: number): number =>
  (MAX_WEEKLY_LOSS_FRACTION * currentWeightKg * KCAL_PER_KG) / DAYS_PER_WEEK;

const baseInput = (
  overrides: Partial<ComputeDailyDeltaInput>
): ComputeDailyDeltaInput => ({
  goalType: "fat_loss",
  currentWeightKg: DEFAULT_WEIGHT_KG,
  targetWeightKg: DEFAULT_TARGET_KG,
  targetDate: TARGET_90D,
  today: TODAY,
  maintenanceKcal: DEFAULT_MAINTENANCE,
  ...overrides,
});

describe("computeDailyDelta (maintain)", () => {
  it("should return a zero delta for a maintain goal", () => {
    // Arrange
    const input = baseInput({ goalType: "maintain" });

    // Act
    const result = computeDailyDelta(input);

    // Assert
    expect(result.dailyDeltaKcal).toBe(0);
    expect(result.capped).toBe(false);
    expect(result.capReason).toBeNull();
    expect(result.overridden).toBe(false);
  });
});

describe("computeDailyDelta (fat_loss)", () => {
  it("should return a negative uncapped delta for a gentle deficit", () => {
    // Arrange
    const input = baseInput({});
    const expected =
      -((DEFAULT_WEIGHT_KG - DEFAULT_TARGET_KG) * KCAL_PER_KG) / DAYS_90;

    // Act
    const result = computeDailyDelta(input);

    // Assert
    expect(result.capped).toBe(false);
    expect(result.dailyDeltaKcal).toBeCloseTo(expected, PRECISION);
    expect(result.dailyDeltaKcal).toBeLessThan(0);
  });

  it("should clamp to the rate cap for an aggressive horizon", () => {
    // Arrange
    const input = baseInput({
      targetWeightKg: AGGRESSIVE_TARGET_KG,
      targetDate: TARGET_30D,
    });
    const cap = rateCapKcal(DEFAULT_WEIGHT_KG);

    // Act
    const result = computeDailyDelta(input);

    // Assert
    expect(result.capped).toBe(true);
    expect(result.capReason).toBe("0.75%/week rate cap");
    expect(result.dailyDeltaKcal).toBeCloseTo(-cap, PRECISION);
  });

  it("should return the raw deficit but keep the flag when the cap is overridden", () => {
    // Arrange
    const input = baseInput({
      targetWeightKg: AGGRESSIVE_TARGET_KG,
      targetDate: TARGET_30D,
      overrideCap: true,
    });
    const rawDeficit =
      ((DEFAULT_WEIGHT_KG - AGGRESSIVE_TARGET_KG) * KCAL_PER_KG) / DAYS_30;

    // Act
    const result = computeDailyDelta(input);

    // Assert
    expect(result.capped).toBe(true);
    expect(result.overridden).toBe(true);
    expect(result.dailyDeltaKcal).toBeCloseTo(-rawDeficit, PRECISION);
  });

  it("should still clamp when the cap binds but no override is given", () => {
    // Arrange
    const input = baseInput({
      targetWeightKg: AGGRESSIVE_TARGET_KG,
      targetDate: TARGET_30D,
    });
    const cap = rateCapKcal(DEFAULT_WEIGHT_KG);

    // Act
    const result = computeDailyDelta(input);

    // Assert
    expect(result.overridden).toBe(false);
    expect(result.dailyDeltaKcal).toBeCloseTo(-cap, PRECISION);
  });

  it("should clamp so intake never falls below FLOOR_KCAL", () => {
    // Arrange
    const input = baseInput({
      maintenanceKcal: LOW_MAINTENANCE,
      targetWeightKg: AGGRESSIVE_TARGET_KG,
      targetDate: TARGET_30D,
    });

    // Act
    const result = computeDailyDelta(input);

    // Assert
    expect(result.capped).toBe(true);
    expect(result.capReason).toBe("FLOOR_KCAL floor");
    expect(input.maintenanceKcal + result.dailyDeltaKcal).toBe(FLOOR_KCAL);
  });

  it("should never push intake below FLOOR_KCAL when maintenance is at the floor", () => {
    // Arrange
    const input = baseInput({
      maintenanceKcal: FLOOR_KCAL,
      targetWeightKg: AGGRESSIVE_TARGET_KG,
      targetDate: TARGET_30D,
    });

    // Act
    const result = computeDailyDelta(input);

    // Assert
    expect(result.dailyDeltaKcal).toBe(0);
    expect(result.capped).toBe(true);
  });
});

describe("computeDailyDelta (muscle_gain)", () => {
  it("should return a positive uncapped surplus under the cap", () => {
    // Arrange
    const input = baseInput({
      goalType: "muscle_gain",
      currentWeightKg: MUSCLE_START_KG,
      targetWeightKg: MUSCLE_TARGET_KG,
    });
    const expected = (ONE_KG * KCAL_PER_KG) / DAYS_90;

    // Act
    const result = computeDailyDelta(input);

    // Assert
    expect(result.capped).toBe(false);
    expect(result.dailyDeltaKcal).toBeCloseTo(expected, PRECISION);
    expect(result.dailyDeltaKcal).toBeGreaterThan(0);
  });

  it("should clamp the surplus to MUSCLE_SURPLUS_CAP for an aggressive gain", () => {
    // Arrange
    const input = baseInput({
      goalType: "muscle_gain",
      currentWeightKg: AGGRESSIVE_TARGET_KG,
      targetWeightKg: MUSCLE_AGGRESSIVE_TARGET_KG,
      targetDate: TARGET_30D,
    });

    // Act
    const result = computeDailyDelta(input);

    // Assert
    expect(result.capped).toBe(true);
    expect(result.capReason).toBe("MUSCLE_SURPLUS_CAP gain-rate cap");
    expect(result.dailyDeltaKcal).toBe(MUSCLE_SURPLUS_CAP);
    expect(result.overridden).toBe(false);
  });

  it("should return the raw surplus but keep the flag when the cap is overridden", () => {
    // Arrange
    const input = baseInput({
      goalType: "muscle_gain",
      currentWeightKg: AGGRESSIVE_TARGET_KG,
      targetWeightKg: MUSCLE_AGGRESSIVE_TARGET_KG,
      targetDate: TARGET_30D,
      overrideCap: true,
    });

    // Act
    const result = computeDailyDelta(input);

    // Assert
    expect(result.capped).toBe(true);
    expect(result.overridden).toBe(true);
    expect(result.dailyDeltaKcal).toBeGreaterThan(MUSCLE_SURPLUS_CAP);
  });
});

describe("computeDailyDelta (guards)", () => {
  it("should treat a past or equal target date as at least one day", () => {
    // Arrange
    const input = baseInput({ targetDate: TODAY });

    // Act
    const result = computeDailyDelta(input);

    // Assert
    expect(result.capped).toBe(true);
    expect(Number.isFinite(result.dailyDeltaKcal)).toBe(true);
  });

  it("should throw for a non-positive current weight", () => {
    // Arrange
    const input = baseInput({ currentWeightKg: 0 });

    // Act
    const act = () => computeDailyDelta(input);

    // Assert
    expect(act).toThrow(RangeError);
  });

  it("should throw for a non-finite maintenance value", () => {
    // Arrange
    const input = baseInput({ maintenanceKcal: Number.NaN });

    // Act
    const act = () => computeDailyDelta(input);

    // Assert
    expect(act).toThrow(RangeError);
  });

  it("should throw for an unparseable target date", () => {
    // Arrange
    const input = baseInput({ targetDate: "not-a-date" });

    // Act
    const act = () => computeDailyDelta(input);

    // Assert
    expect(act).toThrow(RangeError);
  });
});
