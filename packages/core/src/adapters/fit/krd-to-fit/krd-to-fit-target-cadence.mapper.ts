import type { WorkoutStep } from "../../../domain/schemas/workout";
import {
  FIT_TARGET_TYPE,
  KRD_TARGET_TYPE,
  KRD_TARGET_UNIT,
} from "../constants";

export const convertCadenceTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = FIT_TARGET_TYPE.CADENCE;
  if (step.target.type !== KRD_TARGET_TYPE.CADENCE) return;

  const value = step.target.value;
  if (value.unit === KRD_TARGET_UNIT.RANGE) {
    message.targetValue = 0;
    message.customTargetCadenceLow = value.min;
    message.customTargetCadenceHigh = value.max;
  } else {
    message.targetValue = 0;
    message.customTargetCadenceLow = value.value;
    message.customTargetCadenceHigh = value.value;
  }
};
