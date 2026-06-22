/**
 * Expected workout energy estimation. Pure; no adapter/external deps.
 *
 * Estimates activity kcal for a planned workout using the FIRST applicable
 * tier (in priority order):
 *   1. Power tier — `avgPowerWatts · durationSec / 1000` (kJ). Used when an
 *      average power target is present. Mechanical kJ ≈ metabolic kcal because
 *      the conversion factor (4.184 kJ/kcal) and human gross efficiency
 *      (~0.20–0.25) roughly cancel, so 1 kJ of work ≈ 1 kcal expended.
 *   2. Running-distance tier — `distanceKm · weightKg` (≈ 1 kcal/kg/km). Used
 *      when a distance is present for a running-category sport.
 *   3. MET tier — `(durationSec / 3600) · metForSport(sport) · weightKg`. The
 *      universal fallback when neither power nor running distance is available.
 *
 * Result is rounded to integer kcal. Guards mirror bmr.ts / expenditure.ts:
 * required inputs (durationSec, weightKg) must be positive and finite, optional
 * inputs (avgPowerWatts, distanceKm) must be non-negative and finite when
 * present, otherwise a RangeError is thrown.
 */

import type { Sport } from "../../domain/schemas/sport";
import { sportCategory } from "../../domain/schemas/sport-category";
import { metForSport } from "./met-table";

export type ExpectedActivityKcalInput = {
  sport: Sport;
  durationSec: number;
  weightKg: number;
  avgPowerWatts?: number;
  distanceKm?: number;
};

const SECONDS_PER_HOUR = 3600;
const JOULES_PER_KILOJOULE = 1000;

const isPositiveFinite = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const isNonNegativeFiniteOrAbsent = (value: number | undefined): boolean =>
  value === undefined || (Number.isFinite(value) && value >= 0);

const assertInput = (input: ExpectedActivityKcalInput): void => {
  if (
    !isPositiveFinite(input.durationSec) ||
    !isPositiveFinite(input.weightKg)
  ) {
    throw new RangeError(
      "Expected activity kcal requires positive finite durationSec and weightKg."
    );
  }
  if (
    !isNonNegativeFiniteOrAbsent(input.avgPowerWatts) ||
    !isNonNegativeFiniteOrAbsent(input.distanceKm)
  ) {
    throw new RangeError(
      "Expected activity kcal requires non-negative finite avgPowerWatts and distanceKm when present."
    );
  }
};

const isRunningDistance = (input: ExpectedActivityKcalInput): boolean =>
  input.distanceKm !== undefined && sportCategory(input.sport) === "running";

const estimateRaw = (input: ExpectedActivityKcalInput): number => {
  if (input.avgPowerWatts !== undefined) {
    return (input.avgPowerWatts * input.durationSec) / JOULES_PER_KILOJOULE;
  }
  if (isRunningDistance(input)) {
    return (input.distanceKm as number) * input.weightKg;
  }
  const hours = input.durationSec / SECONDS_PER_HOUR;
  return hours * metForSport(input.sport) * input.weightKg;
};

/**
 * Estimate a planned workout's activity kcal via the first applicable tier
 * (power → running-distance → MET). Result is rounded to integer kcal.
 *
 * @throws RangeError when required inputs are not positive and finite, or when
 *   an optional input is present but not non-negative and finite.
 */
export const estimateExpectedActivityKcal = (
  input: ExpectedActivityKcalInput
): number => {
  assertInput(input);
  return Math.round(estimateRaw(input));
};
