import { targetTypeSchema, type Target } from "../../../domain/schemas/target";

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
