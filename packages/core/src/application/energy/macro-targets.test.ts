import { describe, expect, it } from "vitest";

import {
  computeMacroTargets,
  type ComputeMacroTargetsInput,
} from "./macro-targets";

const WEIGHT_KG = 80;
const TARGET_KCAL = 2200;
const PROTEIN_FAT_LOSS_PER_KG = 2.2;
const PROTEIN_MUSCLE_PER_KG = 2.0;
const PROTEIN_MAINTAIN_PER_KG = 1.8;
const FAT_FLOOR_PER_KG = 0.8;
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_FAT = 9;
const LOW_TARGET_KCAL = 1200;
const HEAVY_WEIGHT_KG = 120;
const FRACTIONAL_TARGET_KCAL = 2200.6;
const ROUNDED_TARGET_KCAL = 2201;

const baseInput = (
  overrides: Partial<ComputeMacroTargetsInput>
): ComputeMacroTargetsInput => ({
  targetKcal: TARGET_KCAL,
  weightKg: WEIGHT_KG,
  goalType: "fat_loss",
  ...overrides,
});

describe("computeMacroTargets (protein per goal)", () => {
  it("should use 2.2 g/kg protein for fat_loss", () => {
    // Arrange
    const input = baseInput({ goalType: "fat_loss", weightKg: WEIGHT_KG });

    // Act
    const result = computeMacroTargets(input);

    // Assert
    expect(result.protein_g).toBe(
      Math.round(PROTEIN_FAT_LOSS_PER_KG * WEIGHT_KG)
    );
  });

  it("should use 2.0 g/kg protein for muscle_gain", () => {
    // Arrange
    const input = baseInput({ goalType: "muscle_gain", weightKg: WEIGHT_KG });

    // Act
    const result = computeMacroTargets(input);

    // Assert
    expect(result.protein_g).toBe(
      Math.round(PROTEIN_MUSCLE_PER_KG * WEIGHT_KG)
    );
  });

  it("should use 1.8 g/kg protein for maintain", () => {
    // Arrange
    const input = baseInput({ goalType: "maintain", weightKg: WEIGHT_KG });

    // Act
    const result = computeMacroTargets(input);

    // Assert
    expect(result.protein_g).toBe(
      Math.round(PROTEIN_MAINTAIN_PER_KG * WEIGHT_KG)
    );
  });
});

describe("computeMacroTargets (fat floor and carbs)", () => {
  it("should apply the 0.8 g/kg fat floor", () => {
    // Arrange
    const input = baseInput({ weightKg: WEIGHT_KG });

    // Act
    const result = computeMacroTargets(input);

    // Assert
    expect(result.fat_g).toBe(Math.round(FAT_FLOOR_PER_KG * WEIGHT_KG));
  });

  it("should fill remaining energy into carbohydrate", () => {
    // Arrange
    const input = baseInput({ targetKcal: TARGET_KCAL, weightKg: WEIGHT_KG });
    const proteinKcal =
      PROTEIN_FAT_LOSS_PER_KG * WEIGHT_KG * KCAL_PER_G_PROTEIN;
    const fatKcal = FAT_FLOOR_PER_KG * WEIGHT_KG * KCAL_PER_G_FAT;
    const expectedCarbG =
      (TARGET_KCAL - proteinKcal - fatKcal) / KCAL_PER_G_CARB;

    // Act
    const result = computeMacroTargets(input);

    // Assert
    expect(result.carb_g).toBe(Math.round(expectedCarbG));
  });

  it("should floor carbohydrate at zero when protein and fat exceed the target", () => {
    // Arrange
    // Tiny target with heavy bodyweight forces negative leftover energy.
    const input = baseInput({
      targetKcal: LOW_TARGET_KCAL,
      weightKg: HEAVY_WEIGHT_KG,
    });

    // Act
    const result = computeMacroTargets(input);

    // Assert
    expect(result.carb_g).toBe(0);
  });

  it("should round kcal to a whole integer mirroring the target", () => {
    // Arrange
    const input = baseInput({ targetKcal: FRACTIONAL_TARGET_KCAL });

    // Act
    const result = computeMacroTargets(input);

    // Assert
    expect(result.kcal).toBe(ROUNDED_TARGET_KCAL);
    expect(Number.isInteger(result.kcal)).toBe(true);
  });
});

describe("computeMacroTargets (guards)", () => {
  it("should throw for a non-positive targetKcal", () => {
    // Arrange
    const input = baseInput({ targetKcal: 0 });

    // Act
    const act = () => computeMacroTargets(input);

    // Assert
    expect(act).toThrow(RangeError);
  });

  it("should throw for a non-finite weightKg", () => {
    // Arrange
    const input = baseInput({ weightKg: Number.NaN });

    // Act
    const act = () => computeMacroTargets(input);

    // Assert
    expect(act).toThrow(RangeError);
  });
});
