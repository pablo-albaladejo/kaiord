import {
  durationTypeEnum,
  type Duration,
  type DurationType,
} from "../../../domain/schemas/duration";
import { convertFitDuration } from "../duration/duration.converter";
import { fitDurationTypeEnum } from "../schemas/fit-duration";
import type { FitWorkoutStep } from "../types";

export const mapDuration = (step: FitWorkoutStep): Duration => {
  return convertFitDuration(step);
};

export const mapDurationType = (
  fitDurationType: string | undefined
): DurationType => {
  if (fitDurationType === fitDurationTypeEnum.enum.time)
    return durationTypeEnum.enum.time;
  if (fitDurationType === fitDurationTypeEnum.enum.distance)
    return durationTypeEnum.enum.distance;
  if (fitDurationType === fitDurationTypeEnum.enum.hrLessThan)
    return durationTypeEnum.enum.heart_rate_less_than;
  if (fitDurationType === fitDurationTypeEnum.enum.repeatUntilHrGreaterThan)
    return durationTypeEnum.enum.repeat_until_heart_rate_greater_than;
  return durationTypeEnum.enum.open;
};
