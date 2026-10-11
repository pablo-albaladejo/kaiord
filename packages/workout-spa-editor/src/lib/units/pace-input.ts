/**
 * Pace as people type it — minutes per km, mile, 100 m or 100 yd — against
 * the KRD's canonical speed in m/s. Stored speeds are rounded to the
 * millimetre per second, which is what FIT keeps, so a typed pace survives
 * an export and re-import unchanged.
 */
import type { Units } from "../../types/user-preferences";

export type PaceInputBase = "km" | "mi" | "100m" | "100yd";

const METERS: Record<PaceInputBase, number> = {
  km: 1000,
  mi: 1609.344,
  "100m": 100,
  "100yd": 91.44,
};

const SUFFIX: Record<PaceInputBase, string> = {
  km: "min/km",
  mi: "min/mi",
  "100m": "min/100 m",
  "100yd": "min/100 yd",
};

const MPS_DECIMALS = 1000;

/** Swims are paced per 100; everything else per km (or mile). */
export const paceInputBase = (
  sport: string | undefined,
  units: Units
): PaceInputBase => {
  const imperial = units === "imperial";
  if (sport === "swimming") return imperial ? "100yd" : "100m";
  return imperial ? "mi" : "km";
};

export const paceInputSuffix = (base: PaceInputBase): string => SUFFIX[base];

export const paceSecondsToMps = (
  secondsPerBase: number,
  base: PaceInputBase
): number =>
  Math.round((METERS[base] / secondsPerBase) * MPS_DECIMALS) / MPS_DECIMALS;

export const mpsToPaceSeconds = (mps: number, base: PaceInputBase): number =>
  METERS[base] / mps;
