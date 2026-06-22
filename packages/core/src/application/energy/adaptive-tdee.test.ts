import { describe, expect, it } from "vitest";

import {
  computeAdaptiveTdee,
  KCAL_PER_KG_FAT,
  MIN_ADAPTIVE_DAYS,
} from "./adaptive-tdee";

const WINDOW_DAYS = 28;
const AVG_INTAKE = 2200;

describe("computeAdaptiveTdee", () => {
  it("should recover maintenance above intake when weight is dropping", () => {
    // Arrange
    const weightChangeKg = -1; // lost 1 kg over the window

    // Act
    const result = computeAdaptiveTdee({
      avgDailyIntakeKcal: AVG_INTAKE,
      weightChangeKg,
      windowDays: WINDOW_DAYS,
      daysWithData: WINDOW_DAYS,
    });

    // Assert
    const expectedImbalance = (weightChangeKg * KCAL_PER_KG_FAT) / WINDOW_DAYS;
    expect(result.maintenanceKcal).toBeCloseTo(AVG_INTAKE - expectedImbalance);
    expect(result.maintenanceKcal).toBeGreaterThan(AVG_INTAKE);
  });

  it("should recover maintenance below intake when weight is rising", () => {
    // Arrange
    const weightChangeKg = 1.4; // gained over the window

    // Act
    const result = computeAdaptiveTdee({
      avgDailyIntakeKcal: AVG_INTAKE,
      weightChangeKg,
      windowDays: WINDOW_DAYS,
      daysWithData: WINDOW_DAYS,
    });

    // Assert
    expect(result.maintenanceKcal).toBeLessThan(AVG_INTAKE);
    expect(result.isEstimate).toBe(true);
  });

  it("should report sufficientData once the day count meets the threshold", () => {
    // Arrange
    const daysWithData = MIN_ADAPTIVE_DAYS;

    // Act
    const result = computeAdaptiveTdee({
      avgDailyIntakeKcal: AVG_INTAKE,
      weightChangeKg: -0.5,
      windowDays: WINDOW_DAYS,
      daysWithData,
    });

    // Assert
    expect(result.sufficientData).toBe(true);
  });

  it("should suppress sufficientData below the activation threshold", () => {
    // Arrange
    const daysWithData = MIN_ADAPTIVE_DAYS - 1;

    // Act
    const result = computeAdaptiveTdee({
      avgDailyIntakeKcal: AVG_INTAKE,
      weightChangeKg: -0.5,
      windowDays: WINDOW_DAYS,
      daysWithData,
    });

    // Assert
    expect(result.sufficientData).toBe(false);
  });

  it("should always flag the result as an estimate", () => {
    // Arrange
    const input = {
      avgDailyIntakeKcal: AVG_INTAKE,
      weightChangeKg: 0,
      windowDays: WINDOW_DAYS,
      daysWithData: WINDOW_DAYS,
    };

    // Act
    const result = computeAdaptiveTdee(input);

    // Assert
    expect(result.isEstimate).toBe(true);
    expect(result.maintenanceKcal).toBe(AVG_INTAKE);
  });

  it("should throw a RangeError for a non-positive window", () => {
    // Arrange
    const input = {
      avgDailyIntakeKcal: AVG_INTAKE,
      weightChangeKg: -1,
      windowDays: 0,
      daysWithData: WINDOW_DAYS,
    };

    // Act
    const act = () => computeAdaptiveTdee(input);

    // Assert
    expect(act).toThrow(RangeError);
  });
});
