import type { MacroNutrients } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { toMacroRings } from "./macro-rings-view-model";

const ACTUALS: MacroNutrients = {
  kcal: 1200,
  protein_g: 90,
  carb_g: 120,
  fat_g: 40,
};
const TARGETS: MacroNutrients = {
  kcal: 2400,
  protein_g: 180,
  carb_g: 240,
  fat_g: 80,
};

describe("toMacroRings", () => {
  it("should produce four rings keyed energy/protein/carb/fat in order", () => {
    // Arrange
    const actuals = ACTUALS;

    // Act
    const rings = toMacroRings(actuals, TARGETS);

    // Assert
    expect(rings.map((ring) => ring.key)).toEqual([
      "energy",
      "protein",
      "carb",
      "fat",
    ]);
  });

  it("should set the fraction to actual over target for the energy ring", () => {
    // Arrange
    const actuals = ACTUALS;

    // Act
    const rings = toMacroRings(actuals, TARGETS);

    // Assert
    const expectedFraction = ACTUALS.kcal / TARGETS.kcal;
    expect(rings[0].fraction).toBeCloseTo(expectedFraction);
    expect(rings[0].over).toBe(false);
  });

  it("should clamp the fraction to one and flag over when actual exceeds target", () => {
    // Arrange
    const overKcal = TARGETS.kcal + ACTUALS.kcal;
    const actuals: MacroNutrients = { ...ACTUALS, kcal: overKcal };

    // Act
    const rings = toMacroRings(actuals, TARGETS);

    // Assert
    expect(rings[0].fraction).toBe(1);
    expect(rings[0].over).toBe(true);
  });

  it("should leave the fraction null when no targets are provided", () => {
    // Arrange
    const actuals = ACTUALS;

    // Act
    const rings = toMacroRings(actuals, undefined);

    // Assert
    expect(rings.every((ring) => ring.fraction === null)).toBe(true);
    expect(rings[1].actual).toBe(ACTUALS.protein_g);
  });

  it("should fall back to zero actuals when intake is untracked", () => {
    // Arrange
    const targets = TARGETS;

    // Act
    const rings = toMacroRings(undefined, targets);

    // Assert
    expect(rings.map((ring) => ring.actual)).toEqual([0, 0, 0, 0]);
    expect(rings[0].fraction).toBe(0);
  });
});
