import type { WorkoutStep } from "../../../domain/schemas/workout";
import {
  FIT_TARGET_TYPE,
  KRD_TARGET_TYPE,
  KRD_TARGET_UNIT,
} from "../constants";

export const convertPaceTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = FIT_TARGET_TYPE.SPEED;
  if (step.target.type !== KRD_TARGET_TYPE.PACE) return;

  const value = step.target.value;
  if (value.unit === KRD_TARGET_UNIT.ZONE) {
    message.targetSpeedZone = value.value;
  } else if (value.unit === KRD_TARGET_UNIT.RANGE) {
    message.targetValue = 0;
    message.customTargetSpeedLow = value.min;
    message.customTargetSpeedHigh = value.max;
  } else {
    message.targetValue = 0;
    message.customTargetSpeedLow = value.value;
    message.customTargetSpeedHigh = value.value;
  }
};
