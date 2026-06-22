/**
 * Rolls the day's logged intake entries up into a core `MacroNutrients` for
 * the `macro_actuals` view-model field. Returns `undefined` when nothing is
 * logged (untracked) so the field is omitted rather than a misleading zero.
 *
 * `kcal` is rounded to satisfy the integer-kcal `macroNutrientsSchema`.
 */
import type { MacroNutrients } from "@kaiord/core";

import type { IntakeEntryRecord } from "../../types/intake-entry-record";

export const sumMacroActuals = (
  entries: IntakeEntryRecord[]
): MacroNutrients | undefined => {
  if (entries.length === 0) return undefined;
  const totals = entries.reduce(
    (acc, entry) => ({
      kcal: acc.kcal + entry.kcal,
      protein_g: acc.protein_g + entry.proteinG,
      carb_g: acc.carb_g + entry.carbG,
      fat_g: acc.fat_g + entry.fatG,
    }),
    { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0 }
  );
  return { ...totals, kcal: Math.round(totals.kcal) };
};
