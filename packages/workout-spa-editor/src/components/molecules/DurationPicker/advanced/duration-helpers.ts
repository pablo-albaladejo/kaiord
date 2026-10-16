/**
 * Duration Helpers
 *
 * Helper functions for extracting values from duration objects.
 */

import { getTranslate, type Translate } from "../../../../i18n/use-translate";
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

export const getValueLabel = (
  durationType: AdvancedDurationType,
  t: Translate = getTranslate("common")
): string => {
  const heartRate = t("durationPicker.heartRateLabel", { unit: t("units.hr") });
  if (durationType === "calories") return "Calories";
  if (durationType === "power_less_than") return "Power (watts)";
  if (durationType === "power_greater_than") return "Power (watts)";
  if (durationType === "heart_rate_less_than") return heartRate;
  if (durationType === "repeat_until_time") return "Time (seconds)";
  if (durationType === "repeat_until_distance") return "Distance (meters)";
  if (durationType === "repeat_until_calories") return "Calories";
  if (durationType === "repeat_until_heart_rate_greater_than") return heartRate;
  if (durationType === "repeat_until_heart_rate_less_than") return heartRate;
  if (durationType === "repeat_until_power_less_than") return "Power (watts)";
  if (durationType === "repeat_until_power_greater_than")
    return "Power (watts)";
  return "";
};

export const isRepeatType = (durationType: AdvancedDurationType): boolean => {
  return durationType.startsWith("repeat_until_");
};
