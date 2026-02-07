import { targetTypeSchema, type Target } from "@kaiord/core";
import {
  zwiftCadenceTargetSchema,
  zwiftPaceTargetSchema,
  zwiftPowerTargetSchema,
} from "../schemas/zwift-target";
import {
  convertZwiftCadenceTarget,
  convertZwiftPaceTarget,
  convertZwiftPowerRange,
  convertZwiftPowerTarget,
} from "./target.converter";

/**
 * Map Zwift Power attribute to KRD power target
 * Zwift uses FTP percentage (e.g., 0.85 = 85% FTP)
 * KRD uses percent_ftp (e.g., 85 = 85% FTP)
 */
export const mapZwiftPowerToKrd = (power: unknown): Target => {
  const result = zwiftPowerTargetSchema.safeParse(power);
  if (!result.success) {
    return { type: targetTypeSchema.enum.open };
  }
  return convertZwiftPowerTarget(result.data);
};

/**
 * Map Zwift PowerLow/PowerHigh attributes to KRD power range target
 */
export const mapZwiftPowerRangeToKrd = (
  powerLow: unknown,
  powerHigh: unknown
): Target => {
  const lowResult = zwiftPowerTargetSchema.safeParse(powerLow);
  const highResult = zwiftPowerTargetSchema.safeParse(powerHigh);

  if (!lowResult.success || !highResult.success) {
    return { type: targetTypeSchema.enum.open };
  }

  return convertZwiftPowerRange(lowResult.data, highResult.data);
};

/**
 * Map Zwift pace attribute to KRD pace target
 * Zwift uses seconds per kilometer (sec/km)
 * KRD uses meters per second (m/s)
 */
export const mapZwiftPaceToKrd = (pace: unknown): Target => {
  const result = zwiftPaceTargetSchema.safeParse(pace);
  if (!result.success) {
    return { type: targetTypeSchema.enum.open };
  }
  return convertZwiftPaceTarget(result.data);
};

/**
 * Map Zwift Cadence attribute to KRD cadence target
 * Zwift uses RPM for cycling, SPM for running
 * KRD uses RPM (revolutions per minute)
 */
export const mapZwiftCadenceToKrd = (
  cadence: unknown,
  isRunning = false
): Target => {
  const result = zwiftCadenceTargetSchema.safeParse(cadence);
  if (!result.success) {
    return { type: targetTypeSchema.enum.open };
  }
  return convertZwiftCadenceTarget(result.data, isRunning);
};

/**
 * Map FreeRide (no power) to KRD open target
 */
export const mapFreeRideToKrd = (): Target => {
  return { type: targetTypeSchema.enum.open };
};
