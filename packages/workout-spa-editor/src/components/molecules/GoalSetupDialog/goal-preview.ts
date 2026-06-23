/**
 * Pure goal-setup preview math. No React, no persistence; unit-tested in
 * isolation.
 *
 * `previewGoal` runs the core goal math against a maintenance estimate to show
 * the signed daily delta + target preview and the safety cap flags (`capped`
 * plus `overridden` when the user accepted an unsafe pace) before commit.
 */

import type { MacroNutrients } from "@kaiord/core";

import { deriveGoalTarget } from "../../../application/energy/derive-goal-target";
import type { GoalFormDraft } from "./goal-form-model";

export type GoalPreview = {
  dailyDeltaKcal: number;
  targetKcal: number;
  macroTargets: MacroNutrients;
  capped: boolean;
  /** True when a cap would have bound but the user overrode it. */
  overridden: boolean;
};

export const previewGoal = (
  draft: GoalFormDraft,
  maintenanceKcal: number,
  today: string
): GoalPreview => {
  const derivation = deriveGoalTarget({
    goalType: draft.goalType,
    targetWeightKg: draft.targetWeightKg,
    targetDate: draft.targetDate,
    maintenanceKcal,
    overrideCap: draft.overrideCap,
    // Preview shows the baseline rest-day target; per-day activity
    // periodization is applied later by the day/week energy balance.
    expectedActivityKcal: 0,
    currentWeightKg: draft.startWeightKg,
    today,
  });
  return {
    dailyDeltaKcal: derivation.dailyDeltaKcal,
    targetKcal: derivation.targetKcal,
    macroTargets: derivation.macroTargets,
    capped: derivation.capped,
    overridden: derivation.overridden,
  };
};
