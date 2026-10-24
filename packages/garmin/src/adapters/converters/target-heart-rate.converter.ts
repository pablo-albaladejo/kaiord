import {
  createKrdValidationError,
  createMissingMaxHeartRateError,
} from "@kaiord/core";

type Val = { unit: string; value?: number; min?: number; max?: number };

const PERCENT = 100;
/** KRD `heartRateValueSchema` maximum, in bpm. */
const MAX_HEART_RATE_BPM = 300;
/**
 * Lowest max HR treated as a real measurement. Even older or beta-blocked
 * athletes peak well above 100 bpm, so a smaller value is a typo or a unit
 * mix-up (and 1 % of a 1 bpm max HR would round to a 0 bpm target).
 */
const MIN_PLAUSIBLE_MAX_HEART_RATE_BPM = 100;
/** Smallest heart rate a target can hold; 0 bpm is not a target. */
const MIN_TARGET_BPM = 1;

/**
 * A max HR the writer can use: finite and within 100..300 bpm. Anything else
 * is refused like a missing one, as an unusable FTP is.
 */
const isUsableMaxHr = (maxHr: number | undefined): maxHr is number =>
  maxHr !== undefined &&
  Number.isFinite(maxHr) &&
  maxHr >= MIN_PLAUSIBLE_MAX_HEART_RATE_BPM &&
  maxHr <= MAX_HEART_RATE_BPM;

const outOfRange = (pct: number, maxHr: number, bpm: number) =>
  createKrdValidationError(
    `percent_max ${pct} % of a ${maxHr} bpm max heart rate resolves to ${bpm} bpm, outside ${MIN_TARGET_BPM}..${MAX_HEART_RATE_BPM} bpm`,
    [
      {
        field: "target.value.value",
        message: `Resolves to ${bpm} bpm, outside ${MIN_TARGET_BPM}..${MAX_HEART_RATE_BPM} bpm`,
      },
    ]
  );

const toBpm = (pct: number, maxHr: number): number => {
  const bpm = Math.round((pct * maxHr) / PERCENT);
  if (bpm >= MIN_TARGET_BPM && bpm <= MAX_HEART_RATE_BPM) return bpm;
  throw outOfRange(pct, maxHr, bpm);
};

/**
 * Garmin Connect `heart.rate.zone` targets hold absolute bpm, so a
 * `percent_max` target is resolved against the athlete's max heart rate,
 * `round(pct × maxHr / 100)`. Without a usable max HR the conversion fails
 * instead of writing the percentage as bpm, and a target that resolves
 * outside 1..300 bpm is rejected rather than written as 0 bpm or clamped
 * into a zero-width band. A heart-rate `range` is always bpm in KRD, so only
 * single values need resolving.
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
