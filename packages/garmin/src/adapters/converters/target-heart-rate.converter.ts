import {
  createKrdValidationError,
  createMissingMaxHeartRateError,
} from "@kaiord/core";

type Val = { unit: string; value?: number; min?: number; max?: number };

const PERCENT = 100;
/** KRD `heartRateValueSchema` maximum, in bpm. */
const MAX_HEART_RATE_BPM = 300;

/**
 * A max HR the writer can use: finite, positive and within the schema's
 * 300 bpm. Anything else is refused like a missing one, as FTP is.
 */
const isUsableMaxHr = (maxHr: number | undefined): maxHr is number =>
  maxHr !== undefined &&
  Number.isFinite(maxHr) &&
  maxHr > 0 &&
  maxHr <= MAX_HEART_RATE_BPM;

const toBpm = (pct: number, maxHr: number): number => {
  const bpm = Math.round((pct * maxHr) / PERCENT);
  if (bpm <= MAX_HEART_RATE_BPM) return bpm;
  throw createKrdValidationError(
    `percent_max ${pct} % of a ${maxHr} bpm max heart rate resolves to ${bpm} bpm, above the ${MAX_HEART_RATE_BPM} bpm limit`,
    [
      {
        field: "target.value.value",
        message: `Resolves to ${bpm} bpm, above ${MAX_HEART_RATE_BPM} bpm`,
      },
    ]
  );
};

/**
 * Garmin Connect `heart.rate.zone` targets hold absolute bpm, so a
 * `percent_max` target is resolved against the athlete's max heart rate,
 * `round(pct × maxHr / 100)`. Without a usable max HR the conversion fails
 * instead of writing the percentage as bpm, and a target that resolves above
 * 300 bpm is rejected rather than clamped into a zero-width band. A
 * heart-rate `range` is always bpm in KRD, so only single values need
 * resolving.
 */
export const resolvePercentMaxToBpm = (
  value: Val,
  maxHeartRate: number | undefined
): Val => {
  if (value.unit !== "percent_max") return value;
  if (!isUsableMaxHr(maxHeartRate))
    throw createMissingMaxHeartRateError("garmin");
  if (value.value === undefined) return { unit: "bpm" };
  return { unit: "bpm", value: toBpm(value.value, maxHeartRate) };
};
