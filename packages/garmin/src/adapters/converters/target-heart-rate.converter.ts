import { createMissingMaxHeartRateError } from "@kaiord/core";

type Val = { unit: string; value?: number; min?: number; max?: number };

const PERCENT = 100;

const isUsableMaxHr = (maxHr: number | undefined): maxHr is number =>
  maxHr !== undefined && Number.isFinite(maxHr) && maxHr > 0;

/**
 * Garmin Connect `heart.rate.zone` targets hold absolute bpm, so a
 * `percent_max` target is resolved against the athlete's max heart rate,
 * `round(pct × maxHr / 100)`. Without a usable max HR the conversion fails
 * instead of writing the percentage as bpm. A heart-rate `range` is always
 * bpm in KRD, so only single values need resolving.
 */
export const resolvePercentMaxToBpm = (
  value: Val,
  maxHeartRate: number | undefined
): Val => {
  if (value.unit !== "percent_max") return value;
  if (!isUsableMaxHr(maxHeartRate))
    throw createMissingMaxHeartRateError("garmin");
  if (value.value === undefined) return { unit: "bpm" };
  return {
    unit: "bpm",
    value: Math.round((value.value * maxHeartRate) / PERCENT),
  };
};
