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

const FIT_TO_KRD_DURATION_TYPE: Record<string, DurationType> = {
  [fitDurationTypeSchema.enum.time]: durationTypeSchema.enum.time,
  [fitDurationTypeSchema.enum.distance]: durationTypeSchema.enum.distance,
  [fitDurationTypeSchema.enum.hrLessThan]:
    durationTypeSchema.enum.heart_rate_less_than,
  [fitDurationTypeSchema.enum.repeatUntilHrGreaterThan]:
    durationTypeSchema.enum.repeat_until_heart_rate_greater_than,
  [fitDurationTypeSchema.enum.calories]: durationTypeSchema.enum.calories,
  [fitDurationTypeSchema.enum.powerLessThan]:
    durationTypeSchema.enum.power_less_than,
  [fitDurationTypeSchema.enum.powerGreaterThan]:
    durationTypeSchema.enum.power_greater_than,
  [fitDurationTypeSchema.enum.repeatUntilTime]:
    durationTypeSchema.enum.repeat_until_time,
  [fitDurationTypeSchema.enum.repeatUntilDistance]:
    durationTypeSchema.enum.repeat_until_distance,
  [fitDurationTypeSchema.enum.repeatUntilCalories]:
    durationTypeSchema.enum.repeat_until_calories,
  [fitDurationTypeSchema.enum.repeatUntilHrLessThan]:
    durationTypeSchema.enum.repeat_until_heart_rate_less_than,
  [fitDurationTypeSchema.enum.repeatUntilPowerLessThan]:
    durationTypeSchema.enum.repeat_until_power_less_than,
  [fitDurationTypeSchema.enum.repeatUntilPowerGreaterThan]:
    durationTypeSchema.enum.repeat_until_power_greater_than,
};

export const mapDurationType = (
  fitDurationType: string | undefined
): DurationType => {
  if (!fitDurationType) return durationTypeSchema.enum.open;
  return (
    FIT_TO_KRD_DURATION_TYPE[fitDurationType] ?? durationTypeSchema.enum.open
  );
};
