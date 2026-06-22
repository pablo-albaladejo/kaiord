import { describe, expect, it } from "vitest";

import type { ActivityLevel } from "../../types/profile";
import { neatFactorForActivityLevel } from "./neat-factor";

const MODERATE_BMR_KCAL = 1750;
const REALISTIC_MAINTENANCE_MIN = 2300;
const REALISTIC_MAINTENANCE_MAX = 2500;

const ALL_LEVELS: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];

describe("neatFactorForActivityLevel", () => {
  it.each(ALL_LEVELS)(
    "should return a factor of at least one for the %s level",
    (level) => {
      // Arrange
      const activityLevel = level;

      // Act
      const factor = neatFactorForActivityLevel(activityLevel);

      // Assert
      expect(factor).toBeGreaterThanOrEqual(1);
    }
  );

  it("should fall back to one when the activity level is unset", () => {
    // Arrange
    const level = undefined;

    // Act
    const factor = neatFactorForActivityLevel(level);

    // Assert
    expect(factor).toBe(1);
  });

  it("should increase monotonically from sedentary to very_active", () => {
    // Arrange
    const factors = ALL_LEVELS.map(neatFactorForActivityLevel);

    // Act
    const isAscending = factors.every(
      (factor, index) => index === 0 || factor > factors[index - 1]
    );

    // Assert
    expect(isAscending).toBe(true);
  });

  it("should put a moderate rest-day maintenance in the realistic range", () => {
    // Arrange
    const factor = neatFactorForActivityLevel("moderate");

    // Act
    const maintenanceKcal = MODERATE_BMR_KCAL * factor;

    // Assert
    expect(maintenanceKcal).toBeGreaterThanOrEqual(REALISTIC_MAINTENANCE_MIN);
    expect(maintenanceKcal).toBeLessThanOrEqual(REALISTIC_MAINTENANCE_MAX);
  });
});
