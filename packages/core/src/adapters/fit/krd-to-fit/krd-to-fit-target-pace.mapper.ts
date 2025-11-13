import { targetTypeEnum, targetUnitEnum } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { fitTargetTypeEnum } from "../schemas/fit-target";

export const convertPaceTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = fitTargetTypeEnum.enum.speed;
  if (step.target.type !== targetTypeEnum.enum.pace) return;

  const value = step.target.value;
  if (value.unit === targetUnitEnum.enum.zone) {
    message.targetSpeedZone = value.value;
  } else if (value.unit === targetUnitEnum.enum.range) {
    message.targetValue = 0;
    message.customTargetSpeedLow = value.min;
    message.customTargetSpeedHigh = value.max;
  } else {
    message.targetValue = 0;
    message.customTargetSpeedLow = value.value;
    message.customTargetSpeedHigh = value.value;
  }
};
