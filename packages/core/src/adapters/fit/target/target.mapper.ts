import {
  targetTypeEnum,
  type Target,
  type TargetType,
} from "../../../domain/schemas/target";
import { FIT_TARGET_TYPE } from "../constants";
import type { FitWorkoutStep } from "../types";
import { convertFitTarget } from "./target.converter";

export const mapTarget = (step: FitWorkoutStep): Target => {
  return convertFitTarget(step);
};

export const mapTargetType = (
  fitTargetType: string | undefined
): TargetType => {
  if (fitTargetType === FIT_TARGET_TYPE.POWER) return targetTypeEnum.enum.power;
  if (fitTargetType === FIT_TARGET_TYPE.HEART_RATE)
    return targetTypeEnum.enum.heart_rate;
  if (fitTargetType === FIT_TARGET_TYPE.CADENCE)
    return targetTypeEnum.enum.cadence;
  if (fitTargetType === FIT_TARGET_TYPE.SPEED) return targetTypeEnum.enum.pace;
  if (fitTargetType === FIT_TARGET_TYPE.STROKE_TYPE)
    return targetTypeEnum.enum.stroke_type;
  return targetTypeEnum.enum.open;
};
