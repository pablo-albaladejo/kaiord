/**
 * Macro-nutrient targets from a calorie target. Pure; no adapter/external deps.
 *
 * Protein is set per goal (g/kg bodyweight, all within the evidence-backed
 * 1.6-2.4 band); fat takes a 0.8 g/kg floor; carbohydrate absorbs the
 * remaining energy after protein (4 kcal/g) and fat (9 kcal/g). Carb energy is
 * floored at 0 so an aggressive target never yields negative carbs.
 *
 * Rounding: grams are rounded to whole integers and `kcal` mirrors the input
 * target rounded to a whole integer (the embedding `MacroNutrients.kcal`
 * schema is `int`). Because grams are rounded after the energy split, the macro
 * grams may not multiply back to exactly `kcal`; the calorie target is
 * authoritative.
 */

import type { GoalType } from "../../domain/schemas/health/energy-goal";
import type { MacroNutrients } from "../../domain/schemas/health/nutrition";

/** Protein target in grams per kg bodyweight, by goal (all in 1.6-2.4). */
const PROTEIN_G_PER_KG: Record<GoalType, number> = {
  fat_loss: 2.2,
  muscle_gain: 2.0,
  maintain: 1.8,
};
/** Dietary-fat floor in grams per kg bodyweight. */
const FAT_FLOOR_G_PER_KG = 0.8;
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARB = 4;
const KCAL_PER_G_FAT = 9;

export type ComputeMacroTargetsInput = {
  targetKcal: number;
  weightKg: number;
  goalType: GoalType;
};

const isPositiveFinite = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const assertInputs = (input: ComputeMacroTargetsInput): void => {
  if (
    !isPositiveFinite(input.targetKcal) ||
    !isPositiveFinite(input.weightKg)
  ) {
    throw new RangeError(
      "computeMacroTargets requires positive finite targetKcal and weightKg."
    );
  }
};

/**
 * Derive protein/carb/fat gram targets from a calorie target and bodyweight.
 *
 * @throws RangeError when `targetKcal` or `weightKg` is not positive and finite.
 */
export const computeMacroTargets = (
  input: ComputeMacroTargetsInput
): MacroNutrients => {
  assertInputs(input);
  const proteinG = PROTEIN_G_PER_KG[input.goalType] * input.weightKg;
  const fatG = FAT_FLOOR_G_PER_KG * input.weightKg;
  const carbKcal = Math.max(
    0,
    input.targetKcal - proteinG * KCAL_PER_G_PROTEIN - fatG * KCAL_PER_G_FAT
  );
  const carbG = carbKcal / KCAL_PER_G_CARB;
  return {
    kcal: Math.round(input.targetKcal),
    protein_g: Math.round(proteinG),
    carb_g: Math.round(carbG),
    fat_g: Math.round(fatG),
  };
};
