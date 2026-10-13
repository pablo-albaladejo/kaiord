/**
 * Resolves the maintenance expenditure and current bodyweight a goal needs to
 * derive its day target, independently of the measured-vs-predicted expenditure
 * path (a measured day still needs a modeled maintenance for the goal math).
 *
 * Maintenance is the BMR scaled by the profile's activity-level NEAT factor (the
 * goal delta is measured against this realistic baseline); the day's expected
 * activity is added separately at the periodized-target layer so it raises the
 * day target without inflating the goal delta. Returns `null` when the profile
 * lacks the physiological fields BMR estimation requires, so the use-case leaves
 * `target_kcal` null rather than inventing a number.
 */

import { computeBmr, neatFactorForActivityLevel } from "@kaiord/core";

import { resolveBmrInputs } from "./bmr-inputs";
import { deriveAge, toBodyFatFraction } from "./day-energy-balance-inputs";
import type { DayEnergySources } from "./load-day-energy-sources";

export type GoalMaintenance = {
  maintenanceKcal: number;
  currentWeightKg: number;
};

export const resolveGoalMaintenance = (
  sources: DayEnergySources,
  date: string
): GoalMaintenance | null => {
  const inputs = resolveBmrInputs(sources);
  if (!inputs) return null;
  const { profile, weightKg: currentWeightKg } = inputs;
  const bmr = computeBmr({
    weightKg: currentWeightKg,
    heightCm: profile.height,
    age: deriveAge(profile.birthDate, date),
    sex: profile.sex,
    bodyFatFraction: toBodyFatFraction(sources.bodyComposition),
  });
  const maintenanceKcal =
    bmr.kcal * neatFactorForActivityLevel(profile.activityLevel);
  return { maintenanceKcal, currentWeightKg };
};
