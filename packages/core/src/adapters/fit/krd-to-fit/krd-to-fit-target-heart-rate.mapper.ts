import { targetTypeEnum, targetUnitEnum } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { fitTargetTypeEnum } from "../schemas/fit-target";

export const convertHeartRateTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = fitTargetTypeEnum.enum.heartRate;
  if (step.target.type !== targetTypeEnum.enum.heart_rate) return;

  const value = step.target.value;
  if (value.unit === targetUnitEnum.enum.zone) {
    message.targetHrZone = value.value;
  } else if (value.unit === targetUnitEnum.enum.range) {
    message.targetValue = 0;
    message.customTargetHeartRateLow = value.min;
    message.customTargetHeartRateHigh = value.max;
  } else if (value.unit === targetUnitEnum.enum.bpm) {
    // Garmin encoding: Absolute bpm needs +100 offset
    message.targetValue = value.value + 100;
  } else if (value.unit === targetUnitEnum.enum.percent_max) {
    // Garmin encoding: Percentage max HR has no offset
    message.targetValue = value.value;
  }
};
