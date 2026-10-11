import { type Duration, durationTypeSchema } from "@kaiord/core";

import { interpretWorkoutHeartRate } from "../target/heart-rate-helpers";
import { interpretWorkoutPower } from "../target/power-helpers";
import type { FitDurationData } from "./duration.converter";

export const convertRepeatUntilTime = (
  data: FitDurationData
): Duration | null => {
  if (data.repeatTime !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_time,
      seconds: data.repeatTime,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertRepeatUntilDistance = (
  data: FitDurationData
): Duration | null => {
  if (data.repeatDistance !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_distance,
      meters: data.repeatDistance,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertRepeatUntilCalories = (
  data: FitDurationData
): Duration | null => {
  if (data.repeatCalories !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_calories,
      calories: data.repeatCalories,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertRepeatUntilHrLessThan = (
  data: FitDurationData
): Duration | null => {
  if (data.repeatHr !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_heart_rate_less_than,
      bpm: interpretWorkoutHeartRate(data.repeatHr).value,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertRepeatUntilPowerLessThan = (
  data: FitDurationData
): Duration | null => {
  if (data.repeatPower !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_power_less_than,
      watts: interpretWorkoutPower(data.repeatPower).value,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertRepeatUntilPowerGreaterThan = (
  data: FitDurationData
): Duration | null => {
  if (data.repeatPower !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_power_greater_than,
      watts: interpretWorkoutPower(data.repeatPower).value,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};
