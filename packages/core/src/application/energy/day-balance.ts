/**
 * Day energy-balance assembly. Pure; no adapter/external deps.
 *
 * Combines an already-resolved expenditure result with the day's intake,
 * target, and optional macro breakdowns into a validated `DayEnergyBalance`.
 *
 * Sign convention: `net_kcal = intake - expenditure`. A negative net means a
 * deficit (intake below burn); a positive net means a surplus (intake above
 * burn). When intake is untracked (`intakeKcal === null`) there is no net —
 * `net_kcal` stays `null` rather than collapsing to a misleading zero or
 * full-surplus.
 */

import {
  type DayEnergyBalance,
  dayEnergyBalanceSchema,
  type ExpenditureSource,
} from "../../domain/schemas/health/energy-balance";
import type { MacroNutrients } from "../../domain/schemas/health/nutrition";

/** The expenditure portion already resolved by `resolveDayExpenditure`. */
export type ResolvedExpenditure = {
  basalKcal: number;
  activityKcal: number;
  expenditureKcal: number;
  source: ExpenditureSource;
};

export type AssembleDayEnergyBalanceInput = {
  /** ISO date (YYYY-MM-DD) the balance covers. */
  date: string;
  /** Resolved expenditure (`{ basalKcal, activityKcal, expenditureKcal, source }`). */
  expenditure: ResolvedExpenditure;
  /** Logged intake kcal; `null` means the day is untracked. */
  intakeKcal: number | null;
  /** Active goal target kcal; `null` when no goal is active. */
  targetKcal: number | null;
  /** Optional derived macro targets (present once a goal is active). */
  macroTargets?: MacroNutrients;
  /** Optional logged macro actuals (present once intake is tracked). */
  macroActuals?: MacroNutrients;
};

const resolveNetKcal = (
  expenditureKcal: number,
  intakeKcal: number | null
): number | null => (intakeKcal === null ? null : intakeKcal - expenditureKcal);

/**
 * Assemble a validated `DayEnergyBalance` from a resolved expenditure plus the
 * day's intake, target, and optional macro breakdowns.
 *
 * @throws ZodError when the assembled view-model fails schema validation.
 */
export const assembleDayEnergyBalance = (
  input: AssembleDayEnergyBalanceInput
): DayEnergyBalance =>
  dayEnergyBalanceSchema.parse({
    date: input.date,
    basal_kcal: input.expenditure.basalKcal,
    activity_kcal: input.expenditure.activityKcal,
    expenditure_kcal: input.expenditure.expenditureKcal,
    intake_kcal: input.intakeKcal,
    net_kcal: resolveNetKcal(
      input.expenditure.expenditureKcal,
      input.intakeKcal
    ),
    target_kcal: input.targetKcal,
    macro_targets: input.macroTargets,
    macro_actuals: input.macroActuals,
    source: input.expenditure.source,
  });
