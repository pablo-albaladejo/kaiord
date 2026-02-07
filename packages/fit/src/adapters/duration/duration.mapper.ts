import {
  durationTypeSchema,
  type Duration,
  type DurationType,
} from "@kaiord/core";
import { convertFitDuration } from "../duration/duration.converter";
import { fitDurationTypeSchema } from "../schemas/fit-duration";
import type { FitWorkoutStep } from "../shared/types";

export const mapDuration = (step: FitWorkoutStep): Duration => {
  return convertFitDuration(step);
};

export const mapDurationType = (
  fitDurationType: string | undefined
): DurationType => {
  if (fitDurationType === fitDurationTypeSchema.enum.time)
    return durationTypeSchema.enum.time;
  if (fitDurationType === fitDurationTypeSchema.enum.distance)
    return durationTypeSchema.enum.distance;
  if (fitDurationType === fitDurationTypeSchema.enum.hrLessThan)
    return durationTypeSchema.enum.heart_rate_less_than;
  if (fitDurationType === fitDurationTypeSchema.enum.repeatUntilHrGreaterThan)
    return durationTypeSchema.enum.repeat_until_heart_rate_greater_than;
  if (fitDurationType === fitDurationTypeSchema.enum.calories)
    return durationTypeSchema.enum.calories;
  if (fitDurationType === fitDurationTypeSchema.enum.powerLessThan)
    return durationTypeSchema.enum.power_less_than;
  if (fitDurationType === fitDurationTypeSchema.enum.powerGreaterThan)
    return durationTypeSchema.enum.power_greater_than;
  if (fitDurationType === fitDurationTypeSchema.enum.repeatUntilTime)
    return durationTypeSchema.enum.repeat_until_time;
  if (fitDurationType === fitDurationTypeSchema.enum.repeatUntilDistance)
    return durationTypeSchema.enum.repeat_until_distance;
  if (fitDurationType === fitDurationTypeSchema.enum.repeatUntilCalories)
    return durationTypeSchema.enum.repeat_until_calories;
  if (fitDurationType === fitDurationTypeSchema.enum.repeatUntilHrLessThan)
    return durationTypeSchema.enum.repeat_until_heart_rate_less_than;
  if (fitDurationType === fitDurationTypeSchema.enum.repeatUntilPowerLessThan)
    return durationTypeSchema.enum.repeat_until_power_less_than;
  if (
    fitDurationType === fitDurationTypeSchema.enum.repeatUntilPowerGreaterThan
  )
    return durationTypeSchema.enum.repeat_until_power_greater_than;
  return durationTypeSchema.enum.open;
};
