import { durationTypeSchema, type Duration } from "@kaiord/core";
import type { FitDurationData } from "./duration.converter";

export const convertTimeDuration = (data: FitDurationData): Duration | null => {
  if (data.durationTime !== undefined) {
    return {
      type: durationTypeSchema.enum.time,
      seconds: data.durationTime,
    };
  }
  return null;
};

export const convertDistanceDuration = (
  data: FitDurationData
): Duration | null => {
  if (data.durationDistance !== undefined) {
    return {
      type: durationTypeSchema.enum.distance,
      meters: data.durationDistance,
    };
  }
  return null;
};

export const convertHeartRateLessThan = (
  data: FitDurationData
): Duration | null => {
  if (data.durationHr !== undefined) {
    return {
      type: durationTypeSchema.enum.heart_rate_less_than,
      bpm: data.durationHr,
    };
  }
  return null;
};

export const convertHeartRateGreaterThan = (
  data: FitDurationData
): Duration | null => {
  if (data.repeatHr !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_heart_rate_greater_than,
      bpm: data.repeatHr,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertCaloriesDuration = (
  data: FitDurationData
): Duration | null => {
  if (data.durationCalories !== undefined) {
    return {
      type: durationTypeSchema.enum.calories,
      calories: data.durationCalories,
    };
  }
  return null;
};

export const convertPowerLessThan = (
  data: FitDurationData
): Duration | null => {
  if (data.durationPower !== undefined) {
    return {
      type: durationTypeSchema.enum.power_less_than,
      watts: data.durationPower,
    };
  }
  return null;
};

export const convertPowerGreaterThan = (
  data: FitDurationData
): Duration | null => {
  if (data.durationPower !== undefined) {
    return {
      type: durationTypeSchema.enum.power_greater_than,
      watts: data.durationPower,
    };
  }
  return null;
};
