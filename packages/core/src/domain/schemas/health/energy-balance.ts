import { z } from "zod";

import { macroNutrientsSchema } from "./nutrition";

/**
 * Provenance of a resolved day expenditure: `measured` from ingested device
 * calories, `predicted` from BMR + expected activity, or `mixed` when the day
 * blends both.
 */
export const expenditureSourceSchema = z.enum([
  "measured",
  "predicted",
  "mixed",
]);

export type ExpenditureSource = z.infer<typeof expenditureSourceSchema>;

/**
 * Computed per-day energy-balance view-model — not a persisted payload but the
 * shape the SPA/chatbot read.
 *
 * `intake_kcal` is nullable: `null` means the day is untracked (never a silent
 * zero). `net_kcal` is correspondingly nullable — without a tracked intake
 * there is no net (never a misleading zero or full-surplus). `target_kcal` is
 * nullable when no goal is active. Macro targets and actuals are optional
 * because they only exist once a goal / intake is present.
 */
export const dayEnergyBalanceSchema = z.object({
  date: z.iso.date(),
  basal_kcal: z.number().nonnegative(),
  activity_kcal: z.number().nonnegative(),
  expenditure_kcal: z.number().nonnegative(),
  intake_kcal: z.number().nullable(),
  net_kcal: z.number().nullable(),
  target_kcal: z.number().nullable(),
  macro_targets: macroNutrientsSchema.optional(),
  macro_actuals: macroNutrientsSchema.optional(),
  source: expenditureSourceSchema,
});

export type DayEnergyBalance = z.infer<typeof dayEnergyBalanceSchema>;
