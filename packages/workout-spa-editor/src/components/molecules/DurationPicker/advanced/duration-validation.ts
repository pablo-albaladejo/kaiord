/**
 * Duration Validation
 *
 * Validation functions for advanced duration values.
 */

import type { AdvancedDurationType } from "./duration-type-options";

export const validateValue = (
  durationType: AdvancedDurationType,
  value: string
): { isValid: boolean; error?: string } => {
  const numValue = Number(value);

  if (isNaN(numValue)) {
    return { isValid: false, error: "Must be a valid number" };
  }

  if (numValue <= 0) {
    return { isValid: false, error: "Must be greater than 0" };
  }

  if (durationType === "calories" || durationType === "repeat_until_calories") {
    if (numValue > 10000) {
      return { isValid: false, error: "Maximum 10000 calories" };
    }
  }

  if (
    durationType === "power_less_than" ||
    durationType === "power_greater_than" ||
    durationType === "repeat_until_power_less_than" ||
    durationType === "repeat_until_power_greater_than"
  ) {
    if (numValue > 2000) {
      return { isValid: false, error: "Maximum 2000 watts" };
    }
  }

  if (
    durationType === "heart_rate_less_than" ||
    durationType === "repeat_until_heart_rate_greater_than" ||
    durationType === "repeat_until_heart_rate_less_than"
  ) {
    if (numValue > 220) {
      return { isValid: false, error: "Maximum 220 bpm" };
    }
  }

  if (durationType === "repeat_until_time") {
    if (numValue > 86400) {
      return { isValid: false, error: "Maximum 24 hours" };
    }
  }

  if (durationType === "repeat_until_distance") {
    if (numValue > 1000000) {
      return { isValid: false, error: "Maximum 1000 km" };
    }
  }

  return { isValid: true };
};
