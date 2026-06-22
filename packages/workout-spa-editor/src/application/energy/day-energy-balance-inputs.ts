/**
 * Pure input-derivation helpers for `buildDayEnergyBalance`.
 *
 * Keeps clock/record-shape parsing out of the use-case so it stays readable
 * and each helper is independently testable.
 */

import type { BodyComposition, DailyWellness } from "@kaiord/core";

import type { HealthRecord } from "../../ports/health-record-repository";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Whole years between `birthDate` (YYYY-MM-DD) and `onDate` (YYYY-MM-DD). */
export const deriveAge = (birthDate: string, onDate: string): number => {
  const elapsed =
    Date.parse(`${onDate}T00:00:00.000Z`) -
    Date.parse(`${birthDate}T00:00:00.000Z`);
  return Math.floor(elapsed / MS_PER_YEAR);
};

/** Measured device calories for the day, or `undefined` when uncovered. */
export const toMeasuredWellness = (
  record: HealthRecord<DailyWellness> | undefined
): { activeCalories: number; restingCalories: number } | undefined => {
  if (!record) return undefined;
  return {
    activeCalories: record.krd.activeCalories,
    restingCalories: record.krd.restingCalories,
  };
};

/** Body-fat fraction in [0, 1) from the latest body-composition record. */
export const toBodyFatFraction = (
  record: HealthRecord<BodyComposition> | undefined
): number | undefined => {
  const percent = record?.krd.bodyFatPercent;
  if (percent === undefined) return undefined;
  return percent / 100;
};
