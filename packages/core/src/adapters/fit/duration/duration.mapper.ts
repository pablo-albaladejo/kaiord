import {
  durationTypeSchema,
  type Duration,
  type DurationType,
} from "../../../domain/schemas/duration";
import { convertFitDuration } from "../duration/duration.converter";
import { fitDurationTypeSchema } from "../schemas/fit-duration";
import type { FitWorkoutStep } from "../types";

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
  return durationTypeSchema.enum.open;
};
