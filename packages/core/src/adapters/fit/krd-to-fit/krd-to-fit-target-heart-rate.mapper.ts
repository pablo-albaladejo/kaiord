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
  } else if (value.unit === KRD_TARGET_UNIT.BPM) {
    // Garmin encoding: Absolute bpm needs +100 offset
    message.targetValue = value.value + 100;
  } else if (value.unit === KRD_TARGET_UNIT.PERCENT_MAX) {
    // Garmin encoding: Percentage max HR has no offset
    message.targetValue = value.value;
  } else {
    // Fallback: use custom range with same value
    message.targetValue = 0;
    message.customTargetHeartRateLow = value.value;
    message.customTargetHeartRateHigh = value.value;
  }
};
