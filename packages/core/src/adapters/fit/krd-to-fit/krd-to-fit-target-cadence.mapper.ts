import { targetTypeSchema, targetUnitSchema } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { fitTargetTypeSchema } from "../schemas/fit-target";

export const convertCadenceTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = fitTargetTypeSchema.enum.cadence;
  if (step.target.type !== targetTypeSchema.enum.cadence) return;

  const value = step.target.value;
  if (value.unit === targetUnitSchema.enum.range) {
    message.targetValue = 0;
    message.customTargetCadenceLow = value.min;
    message.customTargetCadenceHigh = value.max;
  } else {
    message.targetValue = 0;
    message.customTargetCadenceLow = value.value;
    message.customTargetCadenceHigh = value.value;
  }
};
