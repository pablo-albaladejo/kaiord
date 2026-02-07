/**
 * Duration Builder
 *
 * Functions to build Duration objects from picker values.
 */

import type { AdvancedDurationType } from "./duration-type-options";
import type { Duration } from "../../../../types/krd";

const buildSimpleDuration = (
  type: AdvancedDurationType,
  value: number
): Duration => {
  const numValue = Math.floor(value);
  if (type === "calories") return { type, calories: numValue };
  if (type === "power_less_than") return { type, watts: value };
  if (type === "power_greater_than") return { type, watts: value };
  return { type: "heart_rate_less_than", bpm: numValue };
};

const buildRepeatDuration = (
  type: AdvancedDurationType,
  value: number,
  repeatFrom: number
): Duration => {
  const numValue = Math.floor(value);

  if (type === "repeat_until_time")
    return { type, seconds: numValue, repeatFrom };
  if (type === "repeat_until_distance")
    return { type, meters: numValue, repeatFrom };
  if (type === "repeat_until_calories")
    return { type, calories: numValue, repeatFrom };
  if (type === "repeat_until_heart_rate_greater_than")
    return { type, bpm: numValue, repeatFrom };
  if (type === "repeat_until_heart_rate_less_than")
    return { type, bpm: numValue, repeatFrom };
  if (type === "repeat_until_power_less_than")
    return { type, watts: value, repeatFrom };
  return { type: "repeat_until_power_greater_than", watts: value, repeatFrom };
};

export const buildDuration = (
  durationType: AdvancedDurationType,
  value: number,
  repeatFrom?: number
): Duration | null => {
  const isRepeat = durationType.startsWith("repeat_until_");
  if (isRepeat) {
    const repeatValue = repeatFrom !== undefined ? Math.floor(repeatFrom) : 0;
    return buildRepeatDuration(durationType, value, repeatValue);
  }
  return buildSimpleDuration(durationType, value);
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
