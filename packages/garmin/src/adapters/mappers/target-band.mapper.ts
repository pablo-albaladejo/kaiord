/**
 * Tolerance bands for single-value power, heart-rate and cadence targets.
 *
 * Garmin has no single-value target: sending the same number as both bounds
 * yields a zero-width alert ("250-250 W") that fires whenever the athlete is
 * off that exact value. A single value is widened to a symmetric band with
 * integer bounds, capped at the KRD schema maxima so a re-imported band still
 * validates. Returns `[low, high]`; the caller applies the Garmin ordering.
 * Non-positive values return null and the caller keeps its passthrough.
 */

/** Power band: ±5 % of the target, but never narrower than ±5 W. */
export const POWER_BAND_PERCENT = 5;
export const POWER_BAND_MIN_HALF_WIDTH_W = 5;
/** Heart-rate band half-width, in bpm. */
export const HEART_RATE_BAND_HALF_WIDTH_BPM = 3;
/** Cadence band half-width, in rpm (spm as KRD stores it). */
export const CADENCE_BAND_HALF_WIDTH_RPM = 3;

/** KRD schema maxima (`powerValueSchema`, `heartRateValueSchema`, `cadenceValueSchema`). */
const MAX_POWER_W = 5000;
const MAX_HEART_RATE_BPM = 300;
const MAX_CADENCE_RPM = 300;

const PERCENT = 100;

export type Band = readonly [low: number, high: number];

const clamp = (value: number, max: number): number =>
  Math.min(Math.max(value, 0), max);

const integerBand = (
  value: number,
  halfWidth: number,
  max: number
): Band | null =>
  value > 0
    ? [
        clamp(Math.round(value - halfWidth), max),
        clamp(Math.round(value + halfWidth), max),
      ]
    : null;

export const buildPowerBand = (watts: number): Band | null =>
  integerBand(
    watts,
    Math.max(
      (watts * POWER_BAND_PERCENT) / PERCENT,
      POWER_BAND_MIN_HALF_WIDTH_W
    ),
    MAX_POWER_W
  );

export const buildHeartRateBand = (bpm: number): Band | null =>
  integerBand(bpm, HEART_RATE_BAND_HALF_WIDTH_BPM, MAX_HEART_RATE_BPM);

export const buildCadenceBand = (rpm: number): Band | null =>
  integerBand(rpm, CADENCE_BAND_HALF_WIDTH_RPM, MAX_CADENCE_RPM);
