import { targetTypeSchema } from "@kaiord/core";
import { targetUnitSchema } from "@kaiord/core";
import type { WorkoutStep } from "@kaiord/core";
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
