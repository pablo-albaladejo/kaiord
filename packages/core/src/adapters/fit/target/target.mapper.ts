import {
  targetTypeEnum,
  type Target,
  type TargetType,
} from "../../../domain/schemas/target";
import { fitTargetTypeEnum } from "../schemas/fit-target";
import type { FitWorkoutStep } from "../types";
import { convertFitTarget } from "./target.converter";

export const mapTarget = (step: FitWorkoutStep): Target => {
  return convertFitTarget(step);
};

export const mapTargetType = (
  fitTargetType: string | undefined
): TargetType => {
  if (fitTargetType === fitTargetTypeEnum.enum.power)
    return targetTypeEnum.enum.power;
  if (fitTargetType === fitTargetTypeEnum.enum.heartRate)
    return targetTypeEnum.enum.heart_rate;
  if (fitTargetType === fitTargetTypeEnum.enum.cadence)
    return targetTypeEnum.enum.cadence;
  if (fitTargetType === fitTargetTypeEnum.enum.speed)
    return targetTypeEnum.enum.pace;
  if (fitTargetType === fitTargetTypeEnum.enum.swimStroke)
    return targetTypeEnum.enum.stroke_type;
  return targetTypeEnum.enum.open;
};
