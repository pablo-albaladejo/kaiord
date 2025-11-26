/**
 * Duration Builder
 *
 * Functions to build Duration objects from picker values.
 */

import type { Duration } from "../../../../types/krd";
import type { AdvancedDurationType } from "./duration-type-options";

export const buildDuration = (
  durationType: AdvancedDurationType,
  value: number,
  repeatFrom?: number
): Duration | null => {
  const numValue = Math.floor(value);
  const repeatValue = repeatFrom !== undefined ? Math.floor(repeatFrom) : 0;

  switch (durationType) {
    case "calories":
      return { type: "calories", calories: numValue };

    case "power_less_than":
      return { type: "power_less_than", watts: value };

    case "power_greater_than":
      return { type: "power_greater_than", watts: value };

    case "heart_rate_less_than":
      return { type: "heart_rate_less_than", bpm: numValue };

    case "repeat_until_time":
      return {
        type: "repeat_until_time",
        seconds: numValue,
        repeatFrom: repeatValue,
      };

    case "repeat_until_distance":
      return {
        type: "repeat_until_distance",
        meters: numValue,
        repeatFrom: repeatValue,
      };

    case "repeat_until_calories":
      return {
        type: "repeat_until_calories",
        calories: numValue,
        repeatFrom: repeatValue,
      };

    case "repeat_until_heart_rate_greater_than":
      return {
        type: "repeat_until_heart_rate_greater_than",
        bpm: numValue,
        repeatFrom: repeatValue,
      };

    case "repeat_until_heart_rate_less_than":
      return {
        type: "repeat_until_heart_rate_less_than",
        bpm: numValue,
        repeatFrom: repeatValue,
      };

    case "repeat_until_power_less_than":
      return {
        type: "repeat_until_power_less_than",
        watts: value,
        repeatFrom: repeatValue,
      };

    case "repeat_until_power_greater_than":
      return {
        type: "repeat_until_power_greater_than",
        watts: value,
        repeatFrom: repeatValue,
      };

    default:
      return null;
  }
};

export const validateRepeatFrom = (
  value: string
): { isValid: boolean; error?: string } => {
  const numValue = Number(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: "Must be a valid number" };
  }

  if (numValue < 0) {
    return { isValid: false, error: "Cannot be negative" };
  }

  return { isValid: true };
};
