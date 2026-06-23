import { z } from "zod";

/**
 * Macro-nutrient value object: an energy total (`kcal`) plus its
 * protein/carbohydrate/fat breakdown in grams.
 *
 * Used both for logged intake actuals and for derived macro targets, so it
 * carries no `kind` discriminator and is not a health-extension payload — it
 * is a reusable building block embedded in higher-level energy view-models.
 */
export const macroNutrientsSchema = z.object({
  kcal: z.number().int().nonnegative(),
  protein_g: z.number().nonnegative(),
  carb_g: z.number().nonnegative(),
  fat_g: z.number().nonnegative(),
});

export type MacroNutrients = z.infer<typeof macroNutrientsSchema>;

/**
 * Time-of-day slot a manual intake entry belongs to. Optional context on an
 * entry; the four canonical slots cover the common logging cadence without a
 * free-form bucket.
 */
export const mealSlotSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export type MealSlot = z.infer<typeof mealSlotSchema>;
