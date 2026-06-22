/**
 * Bridges loaded day sources into the core `resolveDayExpenditure` input and
 * the intake roll-up, plus the BMR-gating predicate.
 *
 * A day is gated when it has no measured wellness AND the profile lacks the
 * physiological fields BMR estimation needs (`height`, `birthDate`, `sex`) —
 * we never show a basal-derived number we cannot honestly compute.
 */

import {
  computeBmr,
  type DayExpenditureInput,
  neatFactorForActivityLevel,
} from "@kaiord/core";

import type { IntakeEntryRecord } from "../../types/intake-entry-record";
import type { Profile } from "../../types/profile";
import {
  deriveAge,
  toBodyFatFraction,
  toMeasuredWellness,
} from "./day-energy-balance-inputs";
import type { DayEnergySources } from "./load-day-energy-sources";

/** Sum of logged intake kcal; `null` when nothing is logged (untracked). */
export const sumIntakeKcal = (entries: IntakeEntryRecord[]): number | null =>
  entries.length === 0
    ? null
    : entries.reduce((total, entry) => total + entry.kcal, 0);

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

/** Predicted expenditure is unavailable without measured data or BMR inputs. */
export const isGated = (sources: DayEnergySources): boolean =>
  toMeasuredWellness(sources.wellness) === undefined &&
  !hasBmrInputs(sources.profile);

/** Build the core expenditure input; caller guarantees `!isGated`. */
export const toExpenditureInput = (
  sources: DayEnergySources,
  date: string,
  expectedActivityKcal: number
): DayExpenditureInput => {
  const measured = toMeasuredWellness(sources.wellness);
  if (measured) return { measured, bmrKcal: 0, expectedActivityKcal };
  const profile = sources.profile!;
  const bmr = computeBmr({
    weightKg: profile.bodyWeight!,
    heightCm: profile.height!,
    age: deriveAge(profile.birthDate!, date),
    sex: profile.sex!,
    bodyFatFraction: toBodyFatFraction(sources.bodyComposition),
  });
  return {
    bmrKcal: bmr.kcal,
    expectedActivityKcal,
    basalActivityFactor: neatFactorForActivityLevel(profile.activityLevel),
  };
};
