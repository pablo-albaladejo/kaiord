import type { WorkoutStep } from "../../domain/schemas/workout";
import { FIT_TARGET_TYPE, KRD_TARGET_TYPE, KRD_TARGET_UNIT } from "./constants";

export const convertTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  if (step.target.type === KRD_TARGET_TYPE.OPEN) {
    message.targetType = FIT_TARGET_TYPE.OPEN;
    return;
  }

  if (step.target.type === KRD_TARGET_TYPE.POWER) {
    convertPowerTarget(step, message);
  } else if (step.target.type === KRD_TARGET_TYPE.HEART_RATE) {
    convertHeartRateTarget(step, message);
  } else if (step.target.type === KRD_TARGET_TYPE.CADENCE) {
    convertCadenceTarget(step, message);
  } else if (step.target.type === KRD_TARGET_TYPE.PACE) {
    convertPaceTarget(step, message);
  }
};

const convertPowerTarget = (
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

const convertHeartRateTarget = (
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

const convertCadenceTarget = (
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

const convertPaceTarget = (
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
