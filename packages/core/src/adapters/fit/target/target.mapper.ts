import {
  targetTypeSchema,
  type Target,
  type TargetType,
} from "../../../domain/schemas/target";
import { fitTargetTypeSchema } from "../schemas/fit-target";
import type { FitWorkoutStep } from "../shared/types";
import { convertFitTarget } from "./target.converter";

export const mapTarget = (step: FitWorkoutStep): Target => {
  return convertFitTarget(step);
};

export const mapTargetType = (
  fitTargetType: string | undefined
): TargetType => {
  if (fitTargetType === fitTargetTypeSchema.enum.power)
    return targetTypeSchema.enum.power;
  if (fitTargetType === fitTargetTypeSchema.enum.heartRate)
    return targetTypeSchema.enum.heart_rate;
  if (fitTargetType === fitTargetTypeSchema.enum.cadence)
    return targetTypeSchema.enum.cadence;
  if (fitTargetType === fitTargetTypeSchema.enum.speed)
    return targetTypeSchema.enum.pace;
  if (fitTargetType === fitTargetTypeSchema.enum.swimStroke)
    return targetTypeSchema.enum.stroke_type;
  return targetTypeSchema.enum.open;
};
