import {
  durationTypeEnum,
  type Duration,
  type DurationType,
} from "../../../domain/schemas/duration";
import { FIT_DURATION_TYPE } from "../constants";
import { convertFitDuration } from "../duration/duration.converter";
import type { FitWorkoutStep } from "../types";

export const mapDuration = (step: FitWorkoutStep): Duration => {
  return convertFitDuration(step);
};

export const mapDurationType = (
  fitDurationType: string | undefined
): DurationType => {
  if (fitDurationType === FIT_DURATION_TYPE.TIME)
    return durationTypeEnum.enum.time;
  if (fitDurationType === FIT_DURATION_TYPE.DISTANCE)
    return durationTypeEnum.enum.distance;
  return durationTypeEnum.enum.open;
};
