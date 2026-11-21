import { type Target, targetTypeSchema } from "@kaiord/core";

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
