import { targetTypeEnum, targetUnitEnum } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { fitTargetTypeEnum } from "../schemas/fit-target";

export const convertCadenceTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = fitTargetTypeEnum.enum.cadence;
  if (step.target.type !== targetTypeEnum.enum.cadence) return;

  const value = step.target.value;
  if (value.unit === targetUnitEnum.enum.range) {
    message.targetValue = 0;
    message.customTargetCadenceLow = value.min;
    message.customTargetCadenceHigh = value.max;
  } else {
    message.targetValue = 0;
    message.customTargetCadenceLow = value.value;
    message.customTargetCadenceHigh = value.value;
  }
};
