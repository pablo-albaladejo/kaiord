import { targetTypeSchema, type Target } from "@kaiord/core";

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
