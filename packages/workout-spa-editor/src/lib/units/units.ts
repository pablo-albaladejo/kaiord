/**
 * Display-only unit conversion. The canonical domain stays in SI
 * (m/s for pace, kilograms for weight); these helpers convert ONLY for
 * rendering. Callers default to `metric` so existing call sites are
 * unaffected until they opt into the active `units` preference.
 */

import type { Units } from "../../types/user-preferences";

export type { Units };

/** Pace base unit as stored on athlete thresholds. */
export type PaceBase = "min_per_km" | "min_per_100m";

const KM_PER_MILE = 1.609344;
const LB_PER_KG = 2.2046226218487757;
// 100 yards = 91.44 m, so seconds per 100yd = seconds per 100m × 0.9144.
const YARD_PER_METER = 0.9144;

const SECONDS_PER_MINUTE = 60;

/** Formats a non-negative seconds value as "m:ss" (e.g. 245 → "4:05"). */
export const formatMinutesSeconds = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "--:--";
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = Math.round(totalSeconds - minutes * SECONDS_PER_MINUTE);
  if (seconds === SECONDS_PER_MINUTE) return `${minutes + 1}:00`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/** Pace unit suffix for the m/s-based running pace (workout step targets). */
export const runPaceLabel = (units: Units): string =>
  units === "imperial" ? "min/mi" : "min/km";

/** Formats a m/s speed as an "m:ss" running pace in the active units. */
export const formatPaceFromMps = (mps: number, units: Units): string => {
  if (!Number.isFinite(mps) || mps <= 0) return "--:--";
  const secondsPerKm = 1000 / mps;
  const seconds =
    units === "imperial" ? secondsPerKm * KM_PER_MILE : secondsPerKm;
  return formatMinutesSeconds(seconds);
};

/** Multiplier applied to a stored pace (seconds per base unit) for display. */
export const paceSecondsFactor = (base: PaceBase, units: Units): number => {
  if (units === "metric") return 1;
  return base === "min_per_100m" ? YARD_PER_METER : KM_PER_MILE;
};

/** Pace suffix for an athlete threshold pace in the active units. */
export const paceUnitLabelFor = (base: PaceBase, units: Units): string => {
  if (base === "min_per_100m") return units === "imperial" ? "/100yd" : "/100m";
  return units === "imperial" ? "/mi" : "/km";
};

/** Weight unit suffix in the active units. */
export const weightUnitLabel = (units: Units): string =>
  units === "imperial" ? "lb" : "kg";

/** Converts a kilogram value to the active units (kg or pounds). */
export const convertKg = (kg: number, units: Units): number =>
  units === "imperial" ? kg * LB_PER_KG : kg;

/** Formats a kilogram value with its unit suffix in the active units. */
export const formatWeightKg = (kg: number, units: Units, digits = 1): string =>
  `${convertKg(kg, units).toFixed(digits)} ${weightUnitLabel(units)}`;
