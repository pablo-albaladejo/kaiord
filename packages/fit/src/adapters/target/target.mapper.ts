import { type Target, type TargetType, targetTypeSchema } from "@kaiord/core";

import { fitDurationTypeSchema } from "../schemas/fit-duration";
import { fitTargetTypeSchema } from "../schemas/fit-target";
import type { FitWorkoutStep } from "../shared/types";
import { convertFitTarget } from "./target.converter";

const D = fitDurationTypeSchema.enum;

// A repeat-until step stores its repeat condition in `targetValue`
// (the profile's `repeat*` sub-fields), so that field is not a target.
const REPEAT_UNTIL_DURATIONS: ReadonlySet<string> = new Set([
  D.repeatUntilTime,
  D.repeatUntilDistance,
  D.repeatUntilCalories,
  D.repeatUntilHrLessThan,
  D.repeatUntilHrGreaterThan,
  D.repeatUntilPowerLessThan,
  D.repeatUntilPowerGreaterThan,
]);

const hasTarget = (step: FitWorkoutStep): boolean =>
  !REPEAT_UNTIL_DURATIONS.has(step.durationType ?? "");

export const mapTarget = (step: FitWorkoutStep): Target =>
  hasTarget(step)
    ? convertFitTarget(step)
    : { type: targetTypeSchema.enum.open };

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

export const mapStepTargetType = (step: FitWorkoutStep): TargetType =>
  hasTarget(step) ? mapTargetType(step.targetType) : targetTypeSchema.enum.open;
