/**
 * Duration Helpers
 *
 * Helper functions for advanced duration picker.
 */

import type { Duration } from "../../../../types/krd";
import type { AdvancedDurationType } from "./duration-type-options";

export const getDurationTypeFromValue = (
  value: Duration | null
): AdvancedDurationType => {
  if (!value) return "calories";
  if (
    value.type === "calories" ||
    value.type === "power_less_than" ||
    value.type === "power_greater_than" ||
    value.type === "heart_rate_less_than" ||
    value.type === "repeat_until_time" ||
    value.type === "repeat_until_distance" ||
    value.type === "repeat_until_calories" ||
    value.type === "repeat_until_heart_rate_greater_than" ||
    value.type === "repeat_until_heart_rate_less_than" ||
    value.type === "repeat_until_power_less_than" ||
    value.type === "repeat_until_power_greater_than"
  ) {
    return value.type;
  }
  return "calories";
};

export const getValueFromDuration = (value: Duration | null): string => {
  if (!value) return "";
  if (value.type === "calories") return value.calories.toString();
  if (value.type === "power_less_than") return value.watts.toString();
  if (value.type === "power_greater_than") return value.watts.toString();
  if (value.type === "heart_rate_less_than") return value.bpm.toString();
  if (value.type === "repeat_until_time") return value.seconds.toString();
  if (value.type === "repeat_until_distance") return value.meters.toString();
  if (value.type === "repeat_until_calories") return value.calories.toString();
  if (value.type === "repeat_until_heart_rate_greater_than")
    return value.bpm.toString();
  if (value.type === "repeat_until_heart_rate_less_than")
    return value.bpm.toString();
  if (value.type === "repeat_until_power_less_than")
    return value.watts.toString();
  if (value.type === "repeat_until_power_greater_than")
    return value.watts.toString();
  return "";
};

export const getRepeatFromValue = (value: Duration | null): string => {
  if (!value) return "0";
  if (
    value.type === "repeat_until_time" ||
    value.type === "repeat_until_distance" ||
    value.type === "repeat_until_calories" ||
    value.type === "repeat_until_heart_rate_greater_than" ||
    value.type === "repeat_until_heart_rate_less_than" ||
    value.type === "repeat_until_power_less_than" ||
    value.type === "repeat_until_power_greater_than"
  ) {
    return value.repeatFrom.toString();
  }
  return "0";
};

export const getValueLabel = (durationType: AdvancedDurationType): string => {
  if (durationType === "calories") return "Calories";
  if (durationType === "power_less_than") return "Power (watts)";
  if (durationType === "power_greater_than") return "Power (watts)";
  if (durationType === "heart_rate_less_than") return "Heart Rate (bpm)";
  if (durationType === "repeat_until_time") return "Time (seconds)";
  if (durationType === "repeat_until_distance") return "Distance (meters)";
  if (durationType === "repeat_until_calories") return "Calories";
  if (durationType === "repeat_until_heart_rate_greater_than")
    return "Heart Rate (bpm)";
  if (durationType === "repeat_until_heart_rate_less_than")
    return "Heart Rate (bpm)";
  if (durationType === "repeat_until_power_less_than") return "Power (watts)";
  if (durationType === "repeat_until_power_greater_than")
    return "Power (watts)";
  return "";
};

export const isRepeatType = (durationType: AdvancedDurationType): boolean => {
  return durationType.startsWith("repeat_until_");
};

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
