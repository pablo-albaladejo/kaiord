import { type Target, targetTypeSchema, zoneToPercentFtp } from "@kaiord/core";

/**
 * Convert Zwift power target (FTP percentage 0.0-3.0) to KRD power target
 * Zwift uses FTP percentage (e.g., 0.85 = 85% FTP)
 * KRD uses percent_ftp (e.g., 85 = 85% FTP)
 */
export const convertZwiftPowerTarget = (ftpPercentage: number): Target => {
  return {
    type: targetTypeSchema.enum.power,
    value: {
      unit: "percent_ftp",
      value: ftpPercentage * 100,
    },
  };
};

/**
 * Convert Zwift power range (PowerLow/PowerHigh) to KRD range target
 */
export const convertZwiftPowerRange = (
  powerLow: number,
  powerHigh: number
): Target => {
  return {
    type: targetTypeSchema.enum.power,
    value: {
      unit: "range",
      min: powerLow * 100,
      max: powerHigh * 100,
    },
  };
};

/**
 * Convert KRD power target to Zwift FTP percentage
 * KRD uses percent_ftp (e.g., 85 = 85% FTP)
 * Zwift uses FTP percentage (e.g., 0.85 = 85% FTP)
 */
export const convertKrdPowerToZwift = (percentFtp: number): number => {
  return percentFtp / 100;
};

/**
 * Convert KRD power range to Zwift PowerLow/PowerHigh
 * Returns [PowerLow, PowerHigh] tuple
 */
export const convertKrdPowerRangeToZwift = (
  min: number,
  max: number
): [number, number] => {
  return [min / 100, max / 100];
};

/**
 * Convert a Coggan power zone (1..7) to its percent-FTP value.
 *
 * Thin adapter-side delegate over the canonical domain helper
 * `zoneToPercentFtp` from `@kaiord/core`: the table is a fitness-domain
 * truth and lives in the domain layer, not in this format adapter.
 *
 * Contract is strict: invalid zones (non-integer, out of [1, 7], NaN,
 * Infinity) propagate a `RangeError`. The KRD `powerValueSchema`
 * already constrains `unit: "zone"` values to `int().min(1).max(7)`, so
 * every in-flight call site receives a validated zone — there is no
 * silent fallback to 100% FTP.
 *
 * @throws RangeError when `zone` is not an integer in [1, 7].
 */
export const convertPowerZoneToPercentFtp = (zone: number): number =>
  zoneToPercentFtp(zone);
