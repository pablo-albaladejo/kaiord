import { intensitySchema } from "../../../domain/schemas/intensity";
import {
  targetTypeSchema,
  targetUnitSchema,
} from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";

export type ZwiftIntervalType =
  | "SteadyState"
  | "Warmup"
  | "Ramp"
  | "Cooldown"
  | "FreeRide";

/**
 * Determine Zwift interval type from KRD workout step
 *
 * Rules:
 * - SteadyState: constant power target (percent_ftp or watts)
 * - Warmup: range target with intensity "warmup"
 * - Cooldown: range target with intensity "cooldown"
 * - Ramp: range target with intensity "active"
 * - FreeRide: open target
 */
export const detectIntervalType = (step: WorkoutStep): ZwiftIntervalType => {
  // FreeRide: open target
  if (step.target.type === targetTypeSchema.enum.open) {
    return "FreeRide";
  }

  // Power targets
  if (step.target.type === targetTypeSchema.enum.power) {
    const powerValue = step.target.value;

    // Range targets: Warmup, Ramp, or Cooldown based on intensity
    if (powerValue.unit === targetUnitSchema.enum.range) {
      if (step.intensity === intensitySchema.enum.warmup) {
        return "Warmup";
      }
      if (step.intensity === intensitySchema.enum.cooldown) {
        return "Cooldown";
      }
      // Default to Ramp for active or unspecified intensity
      return "Ramp";
    }

    // Constant power targets: SteadyState
    if (
      powerValue.unit === targetUnitSchema.enum.percent_ftp ||
      powerValue.unit === targetUnitSchema.enum.watts
    ) {
      return "SteadyState";
    }
  }

  // Default to SteadyState for other target types
  return "SteadyState";
};
