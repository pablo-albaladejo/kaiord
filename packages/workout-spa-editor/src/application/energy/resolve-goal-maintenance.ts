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

import type { HealthWeightRecord } from "../../types/health/health-records";
import type { Profile } from "../../types/profile";
import { deriveAge, toBodyFatFraction } from "./day-energy-balance-inputs";
import type { DayEnergySources } from "./load-day-energy-sources";

export type GoalMaintenance = {
  maintenanceKcal: number;
  currentWeightKg: number;
};

const hasBmrInputs = (
  profile: Profile | undefined
): profile is Profile & {
  height: number;
  birthDate: string;
  sex: NonNullable<Profile["sex"]>;
  bodyWeight: number;
} =>
  profile?.height !== undefined &&
  profile.birthDate !== undefined &&
  profile.sex !== undefined &&
  profile.bodyWeight !== undefined;

/** Latest weigh-in (kg) up to the day, falling back to the profile weight. */
export const resolveCurrentWeightKg = (
  latestWeight: HealthWeightRecord | undefined,
  fallbackKg: number
): number => latestWeight?.krd.weightKilograms ?? fallbackKg;

export const resolveGoalMaintenance = (
  sources: DayEnergySources,
  latestWeight: HealthWeightRecord | undefined,
  date: string
): GoalMaintenance | null => {
  const profile = sources.profile;
  if (!hasBmrInputs(profile)) return null;
  const currentWeightKg = resolveCurrentWeightKg(
    latestWeight,
    profile.bodyWeight
  );
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
