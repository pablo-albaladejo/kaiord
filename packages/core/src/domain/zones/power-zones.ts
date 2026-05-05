/**
 * Coggan 7-band power-zone-to-percent-FTP table.
 *
 * Single source of truth for translating a discrete cycling power zone
 * (1..7) into the percent-of-FTP value the zone represents. Lives in the
 * domain layer because the mapping is a fitness-domain truth (Coggan
 * power-zone definitions), not a format encoding.
 *
 * Zone 1 (Recovery):       55% FTP
 * Zone 2 (Endurance):      75% FTP
 * Zone 3 (Tempo):          90% FTP
 * Zone 4 (Threshold):     105% FTP
 * Zone 5 (VO2 Max):       120% FTP
 * Zone 6 (Anaerobic):     150% FTP
 * Zone 7 (Neuromuscular): 200% FTP
 */

export type PowerZone = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const POWER_ZONES: readonly PowerZone[] = [1, 2, 3, 4, 5, 6, 7] as const;

export const POWER_ZONE_PERCENT_FTP: Readonly<Record<PowerZone, number>> = {
  1: 55,
  2: 75,
  3: 90,
  4: 105,
  5: 120,
  6: 150,
  7: 200,
} as const;

const isFiniteInteger = (value: number): boolean =>
  Number.isFinite(value) && Number.isInteger(value);

/**
 * Type guard: narrows `number` to `PowerZone` when value is an integer in [1, 7].
 */
export const isPowerZone = (value: number): value is PowerZone => {
  if (!isFiniteInteger(value)) return false;
  return value >= 1 && value <= 7;
};

/**
 * Map a Coggan power zone (1..7) to its percent-FTP value.
 *
 * @throws RangeError when `zone` is not an integer in the closed interval [1, 7].
 *         The contract is strict: `0`, `8`, `-1`, `NaN`, `Infinity`, and
 *         non-integers like `1.5` are all rejected. The helper MUST NOT
 *         return `undefined`, `null`, or a silently clamped value.
 */
export const zoneToPercentFtp = (zone: number): number => {
  if (!isPowerZone(zone)) {
    throw new RangeError(
      `Invalid power zone: ${String(zone)}. Expected integer in [1, 7].`
    );
  }
  return POWER_ZONE_PERCENT_FTP[zone];
};

/**
 * Inverse of `zoneToPercentFtp`: map a percent-FTP value back to the zone
 * whose canonical percent equals it exactly.
 *
 * Round-trip identity: `percentFtpToZone(zoneToPercentFtp(z)) === z` for
 * every `z` in [1, 7].
 *
 * @throws RangeError when `percent` does not exactly match any of the seven
 *         canonical band values (55, 75, 90, 105, 120, 150, 200). This
 *         function is intentionally a discrete inverse, not a nearest-band
 *         classifier — adapters that need fuzzy classification should layer
 *         that policy on top.
 */
export const percentFtpToZone = (percent: number): PowerZone => {
  if (!Number.isFinite(percent)) {
    throw new RangeError(
      `Invalid percent-FTP: ${String(percent)}. Expected finite number.`
    );
  }
  for (const zone of POWER_ZONES) {
    if (POWER_ZONE_PERCENT_FTP[zone] === percent) return zone;
  }
  throw new RangeError(
    `No canonical power zone matches ${percent}% FTP. Expected one of: 55, 75, 90, 105, 120, 150, 200.`
  );
};
