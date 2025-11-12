import type { WorkoutStep } from "../../domain/schemas/workout";

export const convertTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  if (step.target.type === "open") {
    message.targetType = "open";
    return;
  }

  if (step.target.type === "power") {
    convertPowerTarget(step, message);
  } else if (step.target.type === "heart_rate") {
    convertHeartRateTarget(step, message);
  } else if (step.target.type === "cadence") {
    convertCadenceTarget(step, message);
  } else if (step.target.type === "pace") {
    convertPaceTarget(step, message);
  }
};

const convertPowerTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = "power";
  if (step.target.type !== "power") return;

  const value = step.target.value;
  if (value.unit === "zone") {
    message.targetPowerZone = value.value;
  } else if (value.unit === "range") {
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
  message.targetType = "heartRate";
  if (step.target.type !== "heart_rate") return;

  const value = step.target.value;
  if (value.unit === "zone") {
    message.targetHrZone = value.value;
  } else if (value.unit === "range") {
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
  message.targetType = "cadence";
  if (step.target.type !== "cadence") return;

  const value = step.target.value;
  if (value.unit === "range") {
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
  message.targetType = "speed";
  if (step.target.type !== "pace") return;

  const value = step.target.value;
  if (value.unit === "zone") {
    message.targetSpeedZone = value.value;
  } else if (value.unit === "range") {
    message.targetValue = 0;
    message.customTargetSpeedLow = value.min;
    message.customTargetSpeedHigh = value.max;
  } else {
    message.targetValue = 0;
    message.customTargetSpeedLow = value.value;
    message.customTargetSpeedHigh = value.value;
  }
};
