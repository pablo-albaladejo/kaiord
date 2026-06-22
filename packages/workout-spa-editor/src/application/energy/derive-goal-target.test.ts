import { describe, expect, it } from "vitest";

import { deriveGoalTarget } from "./derive-goal-target";

describe("deriveGoalTarget", () => {
  it("should produce a negative delta and a below-maintenance target for fat loss", () => {
    // Arrange
    const input = {
      goalType: "fat_loss" as const,
      targetWeightKg: 67,
      targetDate: "2026-12-21",
      maintenanceKcal: 2400,
      expectedActivityKcal: 0,
      currentWeightKg: 70,
      today: "2026-06-21",
    };

    // Act
    const result = deriveGoalTarget(input);

    // Assert
    expect(result.dailyDeltaKcal).toBeLessThan(0);
    expect(result.targetKcal).toBeLessThan(input.maintenanceKcal);
    expect(result.macroTargets.protein_g).toBeGreaterThan(0);
  });

  it("should flag a capped delta when the deficit exceeds the safe rate", () => {
    // Arrange
    const input = {
      goalType: "fat_loss" as const,
      targetWeightKg: 60,
      targetDate: "2026-07-21",
      maintenanceKcal: 2400,
      expectedActivityKcal: 0,
      currentWeightKg: 70,
      today: "2026-06-21",
    };

    // Act
    const result = deriveGoalTarget(input);

    // Assert
    expect(result.capped).toBe(true);
    expect(result.capReason).not.toBeNull();
    expect(result.overridden).toBe(false);
  });

  it("should keep the cap flag but use the raw delta when overrideCap is set", () => {
    // Arrange
    const base = {
      goalType: "fat_loss" as const,
      targetWeightKg: 60,
      targetDate: "2026-07-21",
      maintenanceKcal: 2400,
      expectedActivityKcal: 0,
      currentWeightKg: 70,
      today: "2026-06-21",
    };

    // Act
    const clamped = deriveGoalTarget(base);
    const overridden = deriveGoalTarget({ ...base, overrideCap: true });

    // Assert
    expect(overridden.capped).toBe(true);
    expect(overridden.overridden).toBe(true);
    expect(overridden.dailyDeltaKcal).toBeLessThan(clamped.dailyDeltaKcal);
    expect(overridden.targetKcal).toBeLessThan(clamped.targetKcal);
  });

  it("should produce a positive delta and an above-maintenance target for muscle gain", () => {
    // Arrange
    const input = {
      goalType: "muscle_gain" as const,
      targetWeightKg: 73,
      targetDate: "2026-12-21",
      maintenanceKcal: 2400,
      expectedActivityKcal: 0,
      currentWeightKg: 70,
      today: "2026-06-21",
    };

    // Act
    const result = deriveGoalTarget(input);

    // Assert
    expect(result.dailyDeltaKcal).toBeGreaterThan(0);
    expect(result.targetKcal).toBeGreaterThan(input.maintenanceKcal);
  });

  it("should expose the maintenance it used and the estimate flag", () => {
    // Arrange
    const input = {
      goalType: "fat_loss" as const,
      targetWeightKg: 67,
      targetDate: "2026-12-21",
      maintenanceKcal: 2400,
      maintenanceIsEstimate: true,
      expectedActivityKcal: 0,
      currentWeightKg: 70,
      today: "2026-06-21",
    };

    // Act
    const result = deriveGoalTarget(input);

    // Assert
    expect(result.maintenanceKcal).toBe(input.maintenanceKcal);
    expect(result.maintenanceIsEstimate).toBe(true);
  });

  it("should default the estimate flag to false when not adaptive", () => {
    // Arrange
    const input = {
      goalType: "fat_loss" as const,
      targetWeightKg: 67,
      targetDate: "2026-12-21",
      maintenanceKcal: 2400,
      expectedActivityKcal: 0,
      currentWeightKg: 70,
      today: "2026-06-21",
    };

    // Act
    const result = deriveGoalTarget(input);

    // Assert
    expect(result.maintenanceIsEstimate).toBe(false);
  });

  it("should raise the periodized target by the day's expected activity kcal", () => {
    // Arrange
    const base = {
      goalType: "fat_loss" as const,
      targetWeightKg: 67,
      targetDate: "2026-12-21",
      maintenanceKcal: 2400,
      currentWeightKg: 70,
      today: "2026-06-21",
    };

    // Act
    const rest = deriveGoalTarget({ ...base, expectedActivityKcal: 0 });
    const sport = deriveGoalTarget({ ...base, expectedActivityKcal: 500 });

    // Assert
    expect(sport.targetKcal).toBe(rest.targetKcal + 500);
    expect(sport.dailyDeltaKcal).toBe(rest.dailyDeltaKcal);
  });
});
