import type { Band } from "../mappers/target-band.mapper";
import type { GarminTargetInfo } from "./target-types";

type Val = { unit: string; value?: number; min?: number; max?: number };
type TT = GarminTargetInfo["targetType"];
export type BandFn = (value: number) => Band | null;

const orderedRange = (
  tt: TT,
  min: number | null,
  max: number | null,
  fasterFirst: boolean
): GarminTargetInfo => {
  const [one, two] =
    fasterFirst && min !== null && max !== null ? [max, min] : [min, max];
  return {
    targetType: tt,
    targetValueOne: one,
    targetValueTwo: two,
    zoneNumber: null,
  };
};

/**
 * Garmin wire convention for range targets: speed/power targets are ordered
 * fastest-bound-first (the higher numeric value in `targetValueOne`), while
 * heart-rate and cadence targets are ordered ascending (lower bound first).
 * `fasterFirst` selects between the two orderings — `true` for power and pace,
 * `false` for heart rate and cadence (see the call sites in
 * `convertKrdTargetToGarmin`). A single value is widened by `band` into a
 * range (see `target-band.mapper`) so Garmin never gets a zero-width target.
 */
export const mapRangeOrValue = (
  tt: TT,
  value: Val,
  fasterFirst: boolean,
  band?: BandFn
): GarminTargetInfo => {
  if (value.unit === "range") {
    return orderedRange(tt, value.min ?? null, value.max ?? null, fasterFirst);
  }
  const widened = value.value != null && band ? band(value.value) : null;
  if (widened) return orderedRange(tt, widened[0], widened[1], fasterFirst);
  return orderedRange(tt, value.value ?? null, value.value ?? null, false);
};

export const mapZoneOrRange = (
  tt: TT,
  value: Val,
  fasterFirst: boolean,
  band: BandFn
): GarminTargetInfo => {
  if (value.unit === "zone") {
    return {
      targetType: tt,
      targetValueOne: null,
      targetValueTwo: null,
      zoneNumber: value.value ?? null,
    };
  }
  return mapRangeOrValue(tt, value, fasterFirst, band);
};
