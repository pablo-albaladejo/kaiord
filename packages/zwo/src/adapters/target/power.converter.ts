import { type Target, targetTypeSchema } from "@kaiord/core";

const PERCENT = 100;
// One decimal of percent FTP: drops float noise (0.57 * 100 = 56.99999999999999)
// while a fraction written back as percent / 100 stays the original (0.57).
const PERCENT_DECIMAL_SCALE = 10;

const fractionToPercent = (fraction: number): number =>
  Math.round(fraction * PERCENT * PERCENT_DECIMAL_SCALE) /
  PERCENT_DECIMAL_SCALE;

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
      value: fractionToPercent(ftpPercentage),
    },
  };
};

/**
 * Convert Zwift power range (PowerLow/PowerHigh, FTP fractions) to a KRD
 * range target whose bounds are percent FTP (`basis: "percent_ftp"`). KRD
 * ranges are always `min <= max`; a descending block (a cooldown) is flagged
 * on the step by the caller, not by inverted bounds.
 */
export const convertZwiftPowerRange = (
  powerLow: number,
  powerHigh: number
): Target => {
  return {
    type: targetTypeSchema.enum.power,
    value: {
      unit: "range",
      min: fractionToPercent(Math.min(powerLow, powerHigh)),
      max: fractionToPercent(Math.max(powerLow, powerHigh)),
      basis: "percent_ftp",
    },
  };
};
