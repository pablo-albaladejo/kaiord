/**
 * Duration Calculation Helpers
 *
 * Functions for calculating duration and distance from workout steps.
 */

import type { Duration } from "../types/krd";

/**
 * Calculate duration in seconds for a single step
 * Returns null if duration cannot be determined (open, conditional, etc.)
 */
export const calculateStepDuration = (duration: Duration): number | null => {
  switch (duration.type) {
    case "time":
      return duration.seconds;
    case "repeat_until_time":
      return duration.seconds;
    case "open":
    case "heart_rate_less_than":
    case "repeat_until_heart_rate_greater_than":
    case "repeat_until_heart_rate_less_than":
    case "power_less_than":
    case "power_greater_than":
    case "repeat_until_power_less_than":
    case "repeat_until_power_greater_than":
    case "calories":
    case "repeat_until_calories":
    case "distance":
    case "repeat_until_distance":
      return null;
    default:
      return null;
  }
};

/**
 * Calculate distance in meters for a single step
 * Returns null if distance cannot be determined
 */
export const calculateStepDistance = (duration: Duration): number | null => {
  switch (duration.type) {
    case "distance":
      return duration.meters;
    case "repeat_until_distance":
      return duration.meters;
    case "time":
    case "repeat_until_time":
    case "open":
    case "heart_rate_less_than":
    case "repeat_until_heart_rate_greater_than":
    case "repeat_until_heart_rate_less_than":
    case "power_less_than":
    case "power_greater_than":
    case "repeat_until_power_less_than":
    case "repeat_until_power_greater_than":
    case "calories":
    case "repeat_until_calories":
      return null;
    default:
      return null;
  }
};

/**
 * Check if a duration is open-ended (cannot be precisely calculated)
 */
export const isOpenDuration = (duration: Duration): boolean => {
  return (
    duration.type === "open" ||
    duration.type === "heart_rate_less_than" ||
    duration.type === "repeat_until_heart_rate_greater_than" ||
    duration.type === "repeat_until_heart_rate_less_than" ||
    duration.type === "power_less_than" ||
    duration.type === "power_greater_than" ||
    duration.type === "repeat_until_power_less_than" ||
    duration.type === "repeat_until_power_greater_than"
  );
};
