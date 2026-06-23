/**
 * Resolves the day's goal derivation and its exposed `goal` context from the
 * loaded sources. Returns `null` when no goal is active or the profile lacks
 * the BMR inputs the goal math requires, so the use-case leaves `target_kcal`
 * null and `goal` null (Phase 1 shape) in those cases.
 *
 * When an adaptive maintenance estimate is available AND has `sufficientData`,
 * it replaces the modeled BMR maintenance feeding the periodized target so the
 * target self-corrects from observed history; otherwise the modeled maintenance
 * stays in use. The chosen maintenance + an estimate flag are threaded out so
 * the UI and chat can label it.
 */

import type { AdaptiveTdeeResult } from "@kaiord/core";

import type { DayEnergyGoalContext } from "./day-energy-balance-result";
import { deriveGoalTarget } from "./derive-goal-target";
import type { DayEnergySources } from "./load-day-energy-sources";
import { resolveGoalMaintenance } from "./resolve-goal-maintenance";

export type DayGoalDerivation = ReturnType<typeof deriveGoalTarget>;

const pickMaintenance = (
  modeledKcal: number,
  adaptive: AdaptiveTdeeResult | null
): { maintenanceKcal: number; isEstimate: boolean } =>
  adaptive && adaptive.sufficientData
    ? { maintenanceKcal: adaptive.maintenanceKcal, isEstimate: true }
    : { maintenanceKcal: modeledKcal, isEstimate: false };

export const resolveDayGoalTarget = (
  sources: DayEnergySources,
  today: string,
  expectedActivityKcal: number,
  adaptive: AdaptiveTdeeResult | null = null
): DayGoalDerivation | null => {
  if (!sources.target) return null;
  const maintenance = resolveGoalMaintenance(
    sources,
    sources.latestWeight,
    today
  );
  if (!maintenance) return null;
  const chosen = pickMaintenance(maintenance.maintenanceKcal, adaptive);
  return deriveGoalTarget({
    goalType: sources.target.goalType,
    targetWeightKg: sources.target.targetWeightKg,
    targetDate: sources.target.targetDate,
    maintenanceKcal: chosen.maintenanceKcal,
    maintenanceIsEstimate: chosen.isEstimate,
    overrideCap: sources.target.overrideCap,
    expectedActivityKcal,
    currentWeightKg: maintenance.currentWeightKg,
    today,
  });
};

export const toGoalContext = (
  derivation: DayGoalDerivation | null
): DayEnergyGoalContext | null =>
  derivation
    ? {
        goalType: derivation.goalType,
        dailyDeltaKcal: derivation.dailyDeltaKcal,
        capped: derivation.capped,
        capReason: derivation.capReason,
        overridden: derivation.overridden,
        maintenanceKcal: derivation.maintenanceKcal,
        maintenanceIsEstimate: derivation.maintenanceIsEstimate,
      }
    : null;
