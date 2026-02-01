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
 * Convert Zwift cadence target to KRD cadence target.
 *
 * Cycling: RPM stays as RPM (crank revolutions per minute)
 * Running: SPM (steps per minute) is converted to RPM.
 *
 * Running cadence conversion rationale:
 * - Zwift and most running apps use SPM (steps per minute)
 * - KRD standardizes on RPM (revolutions/strides per minute)
 * - One stride (revolution) = two steps (left + right foot)
 * - Therefore: RPM = SPM / 2
 *
 * Example: 180 SPM = 90 RPM (90 full strides per minute)
 */
export const convertZwiftCadenceTarget = (
  cadence: number,
  isRunning = false
): Target => {
  // Convert SPM to RPM for running (SPM = 2 * RPM, so RPM = SPM / 2)
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
 * Convert KRD cadence target to Zwift cadence.
 *
 * KRD uses RPM (revolutions/strides per minute) for all sports.
 * Zwift uses RPM for cycling, SPM (steps per minute) for running.
 *
 * Running conversion: SPM = RPM * 2
 * (One stride = two steps, so multiply RPM by 2 to get SPM)
 *
 * Example: 90 RPM = 180 SPM
 */
export const convertKrdCadenceToZwift = (
  rpm: number,
  isRunning = false
): number => {
  // Convert RPM to SPM for running (SPM = 2 * RPM)
  return isRunning ? rpm * 2 : rpm;
};
