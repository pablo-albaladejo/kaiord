import { targetTypeSchema, type Target } from "../../../domain/schemas/target";

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
 * Convert Zwift pace target (seconds per kilometer) to KRD pace target (meters per second)
 * Formula: m/s = 1000 / sec_per_km
 */
export const convertZwiftPaceTarget = (secPerKm: number): Target => {
  return {
    type: targetTypeSchema.enum.pace,
    value: {
      unit: "mps",
      value: 1000 / secPerKm,
    },
  };
};

/**
 * Convert Zwift cadence target to KRD cadence target
 * For cycling: RPM stays as RPM
 * For running: SPM should be converted to RPM (spm/2)
 */
export const convertZwiftCadenceTarget = (
  cadence: number,
  isRunning = false
): Target => {
  const rpm = isRunning ? cadence / 2 : cadence;

  return {
    type: targetTypeSchema.enum.cadence,
    value: {
      unit: "rpm",
      value: rpm,
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
 * Convert KRD pace target to Zwift pace (seconds per kilometer)
 * KRD uses meters per second (m/s)
 * Zwift uses seconds per kilometer (sec/km)
 * Formula: sec/km = 1000 / m/s
 */
export const convertKrdPaceToZwift = (metersPerSecond: number): number => {
  return 1000 / metersPerSecond;
};

/**
 * Convert KRD cadence target to Zwift cadence
 * KRD uses RPM (revolutions per minute)
 * Zwift uses RPM for cycling, SPM for running
 * For running: SPM = RPM * 2
 */
export const convertKrdCadenceToZwift = (
  rpm: number,
  isRunning = false
): number => {
  return isRunning ? rpm * 2 : rpm;
};
