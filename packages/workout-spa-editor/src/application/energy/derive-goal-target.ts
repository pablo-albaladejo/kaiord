/**
 * Derives the day's goal-driven calorie + macro targets from an active
 * `EnergyTargetRecord`, the resolved maintenance expenditure, and the current
 * bodyweight, by composing the pure core calculators.
 *
 * Returns `null` when no goal is active so the use-case keeps `target_kcal`
 * null (Phase 1 behaviour) for goal-less profiles. The signed `dailyDeltaKcal`
 * (negative = deficit, positive = surplus) and the `capped`/`capReason` flags
 * are surfaced so the card and chat tool can render the safety warning.
 */

import {
  computeDailyDelta,
  computeMacroTargets,
  computePeriodizedTarget,
  type GoalType,
  type MacroNutrients,
} from "@kaiord/core";

export type GoalTargetDerivation = {
  targetKcal: number;
  macroTargets: MacroNutrients;
  goalType: GoalType;
  dailyDeltaKcal: number;
  capped: boolean;
  capReason: string | null;
  /** True when a cap would have bound but the user overrode it. */
  overridden: boolean;
  /** Maintenance kcal the target was built on (modeled or adaptive estimate). */
  maintenanceKcal: number;
  /** True when an adaptive estimate supplied the maintenance. */
  maintenanceIsEstimate: boolean;
};

export type DeriveGoalTargetInput = {
  goalType: GoalType;
  targetWeightKg: number;
  targetDate: string;
  /** Modeled maintenance expenditure (BMR) the goal delta is measured against. */
  maintenanceKcal: number;
  /** Day's expected activity kcal; raises the periodized target on sport days. */
  expectedActivityKcal: number;
  /** Latest known bodyweight (kg) for delta + macro derivation. */
  currentWeightKg: number;
  /** ISO date (YYYY-MM-DD) used as the horizon start. */
  today: string;
  /** True when `maintenanceKcal` is an adaptive (observed-history) estimate. */
  maintenanceIsEstimate?: boolean;
  /** When true, accept an unsafe pace: return the raw delta but keep the flag. */
  overrideCap?: boolean;
};

export const deriveGoalTarget = (
  input: DeriveGoalTargetInput
): GoalTargetDerivation => {
  const delta = computeDailyDelta({
    goalType: input.goalType,
    currentWeightKg: input.currentWeightKg,
    targetWeightKg: input.targetWeightKg,
    targetDate: input.targetDate,
    today: input.today,
    maintenanceKcal: input.maintenanceKcal,
    overrideCap: input.overrideCap,
  });
  const targetKcal = computePeriodizedTarget({
    bmrKcal: input.maintenanceKcal,
    expectedActivityKcal: input.expectedActivityKcal,
    dailyDeltaKcal: delta.dailyDeltaKcal,
  });
  const macroTargets = computeMacroTargets({
    targetKcal,
    weightKg: input.currentWeightKg,
    goalType: input.goalType,
  });
  return {
    targetKcal,
    macroTargets,
    goalType: input.goalType,
    dailyDeltaKcal: delta.dailyDeltaKcal,
    capped: delta.capped,
    capReason: delta.capReason,
    overridden: delta.overridden,
    maintenanceKcal: input.maintenanceKcal,
    maintenanceIsEstimate: input.maintenanceIsEstimate ?? false,
  };
};
