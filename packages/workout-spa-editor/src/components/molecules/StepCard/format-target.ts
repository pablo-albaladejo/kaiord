import type { WorkoutStep } from "../../../types/krd";
import {
  formatCadenceTarget,
  formatHeartRateTarget,
  formatPaceTarget,
  formatPowerTarget,
} from "./format-target-helpers";

/**
 * Format target for display
 */
export const formatTarget = (step: WorkoutStep): string => {
  const { target, targetType } = step;

  if (targetType === "open") {
    return "Open";
  }

  if (!("value" in target)) {
    return targetType.replace(/_/g, " ");
  }

  const value = target.value;

  switch (targetType) {
    case "power":
      return formatPowerTarget(value);
    case "heart_rate":
      return formatHeartRateTarget(value);
    case "cadence":
      return formatCadenceTarget(value);
    case "pace":
      return formatPaceTarget(value);
    default:
      return targetType.replace(/_/g, " ");
  }
};
