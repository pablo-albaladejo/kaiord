import type { WorkoutStep } from "../../../domain/schemas/workout";
import {
  FIT_TARGET_TYPE,
  KRD_TARGET_TYPE,
  KRD_TARGET_UNIT,
} from "../constants";

export const convertPowerTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = FIT_TARGET_TYPE.POWER;
  if (step.target.type !== KRD_TARGET_TYPE.POWER) return;

  const value = step.target.value;
  if (value.unit === KRD_TARGET_UNIT.ZONE) {
    message.targetPowerZone = value.value;
  } else if (value.unit === KRD_TARGET_UNIT.RANGE) {
    message.targetValue = 0;
    message.customTargetPowerLow = value.min;
    message.customTargetPowerHigh = value.max;
  } else {
    message.targetValue = 0;
    message.customTargetPowerLow = value.value;
    message.customTargetPowerHigh = value.value;
  }
};
