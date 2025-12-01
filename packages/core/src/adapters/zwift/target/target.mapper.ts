import { targetTypeSchema, type Target } from "../../../domain/schemas/target";
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

// ============================================
// Zwift → KRD Mappers
// ============================================

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

// ============================================
// KRD → Zwift Mappers
// ============================================

/**
 * Map KRD power target to Zwift Power attribute
 * KRD uses percent_ftp (e.g., 85 = 85% FTP)
 * Zwift uses FTP percentage (e.g., 0.85 = 85% FTP)
 */
export const mapPowerTargetToZwift = (target: Target): number | undefined => {
  if (target.type !== targetTypeSchema.enum.power) {
    return undefined;
  }

  const value = target.value;

  if (value.unit === "percent_ftp") {
    return value.value / 100;
  }

  return undefined;
};

/**
 * Map KRD power range target to Zwift PowerLow/PowerHigh attributes
 * Returns [PowerLow, PowerHigh] tuple
 */
export const mapPowerRangeToZwift = (
  target: Target
): [number, number] | undefined => {
  if (target.type !== targetTypeSchema.enum.power) {
    return undefined;
  }

  const value = target.value;

  if (value.unit === "range") {
    return [value.min / 100, value.max / 100];
  }

  return undefined;
};

/**
 * Map KRD pace target to Zwift pace attribute
 * KRD uses meters per second (m/s)
 * Zwift uses seconds per kilometer (sec/km)
 * Formula: sec/km = 1000 / m/s
 */
export const mapPaceTargetToZwift = (target: Target): number | undefined => {
  if (target.type !== targetTypeSchema.enum.pace) {
    return undefined;
  }

  const value = target.value;

  if (value.unit === "mps") {
    return 1000 / value.value;
  }

  return undefined;
};

/**
 * Map KRD cadence target to Zwift Cadence attribute
 * KRD uses RPM (revolutions per minute)
 * Zwift uses RPM for cycling, SPM for running
 * For running: SPM = RPM * 2
 */
export const mapCadenceTargetToZwift = (
  target: Target,
  isRunning = false
): number | undefined => {
  if (target.type !== targetTypeSchema.enum.cadence) {
    return undefined;
  }

  const value = target.value;

  if (value.unit === "rpm") {
    return isRunning ? value.value * 2 : value.value;
  }

  return undefined;
};

/**
 * Check if target is an open target (maps to FreeRide in Zwift)
 */
export const isOpenTarget = (target: Target): boolean => {
  return target.type === targetTypeSchema.enum.open;
};
