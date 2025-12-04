import { targetTypeSchema } from "../../../domain/schemas/target";
import { targetUnitSchema } from "../../../domain/schemas/target-values";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { fitTargetTypeSchema } from "../schemas/fit-target";

export const convertPaceTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = fitTargetTypeSchema.enum.speed;
  if (step.target.type !== targetTypeSchema.enum.pace) return;

  const value = step.target.value;
  if (value.unit === targetUnitSchema.enum.zone) {
    message.targetSpeedZone = value.value;
  } else if (value.unit === targetUnitSchema.enum.range) {
    message.targetValue = 0;
    message.customTargetSpeedLow = value.min;
    message.customTargetSpeedHigh = value.max;
  } else {
    message.targetValue = 0;
    message.customTargetSpeedLow = value.value;
    message.customTargetSpeedHigh = value.value;
  }
};
