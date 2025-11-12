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
  } else if (value.unit === KRD_TARGET_UNIT.WATTS) {
    // Garmin encoding: Absolute watts need +1000 offset
    message.targetValue = value.value + 1000;
  } else if (value.unit === KRD_TARGET_UNIT.PERCENT_FTP) {
    // Garmin encoding: Percentage FTP has no offset
    message.targetValue = value.value;
  } else {
    // Fallback: use custom range with same value
    message.targetValue = 0;
    message.customTargetPowerLow = value.value;
    message.customTargetPowerHigh = value.value;
  }
};
