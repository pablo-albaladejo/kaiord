import type { WorkoutStep } from "../../../domain/schemas/workout";
import {
  FIT_TARGET_TYPE,
  KRD_TARGET_TYPE,
  KRD_TARGET_UNIT,
} from "../constants";

export const convertHeartRateTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = FIT_TARGET_TYPE.HEART_RATE;
  if (step.target.type !== KRD_TARGET_TYPE.HEART_RATE) return;

  const value = step.target.value;
  if (value.unit === KRD_TARGET_UNIT.ZONE) {
    message.targetHrZone = value.value;
  } else if (value.unit === KRD_TARGET_UNIT.RANGE) {
    message.targetValue = 0;
    message.customTargetHeartRateLow = value.min;
    message.customTargetHeartRateHigh = value.max;
  } else {
    message.targetValue = 0;
    message.customTargetHeartRateLow = value.value;
    message.customTargetHeartRateHigh = value.value;
  }
};
