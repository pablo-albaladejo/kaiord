import {
  durationTypeSchema,
  type Duration,
} from "../../../domain/schemas/duration";
import type { FitDurationData } from "./duration.converter";

export const convertRepeatUntilTime = (
  data: FitDurationData
): Duration | null => {
  if (data.durationTime !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_time,
      seconds: data.durationTime,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertRepeatUntilDistance = (
  data: FitDurationData
): Duration | null => {
  if (data.durationDistance !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_distance,
      meters: data.durationDistance,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertRepeatUntilCalories = (
  data: FitDurationData
): Duration | null => {
  if (data.durationCalories !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_calories,
      calories: data.durationCalories,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertRepeatUntilHrLessThan = (
  data: FitDurationData
): Duration | null => {
  if (data.durationHr !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_heart_rate_less_than,
      bpm: data.durationHr,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertRepeatUntilPowerLessThan = (
  data: FitDurationData
): Duration | null => {
  if (data.durationPower !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_power_less_than,
      watts: data.durationPower,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertRepeatUntilPowerGreaterThan = (
  data: FitDurationData
): Duration | null => {
  if (data.durationPower !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_power_greater_than,
      watts: data.durationPower,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};
