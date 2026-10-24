/**
 * Tolerance bands for single-value power, heart-rate and cadence targets.
 *
 * Garmin has no single-value target: sending the same number as both bounds
 * yields a zero-width alert ("250-250 W") that fires whenever the athlete is
 * off that exact value. A single value is widened to a symmetric band with
 * integer bounds, capped at the KRD schema maxima so a re-imported band still
 * validates. The centre and the half-width are rounded separately, so the
 * band stays symmetric around the rounded target (213.3 W -> 202..224 W).
 * A target whose half-width is already an integer is unchanged by this; a
 * .5 half-width rounds outward on both sides (250 W, ±12.5 -> 237..263 W).
 * Returns `[low, high]`; the caller applies the Garmin ordering (power
 * higher value first). Some authored GCN fixtures list power ascending: the
 * reader accepts either order, so do not change the writer to match them.
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
): Band | null => {
  if (!(value > 0)) return null;
  const centre = Math.round(value);
  const half = Math.round(halfWidth);
  return [clamp(centre - half, max), clamp(centre + half, max)];
};

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
