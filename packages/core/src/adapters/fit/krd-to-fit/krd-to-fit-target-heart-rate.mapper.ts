import { targetTypeSchema } from "../../../domain/schemas/target";
import { targetUnitSchema } from "../../../domain/schemas/target-values";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { fitTargetTypeSchema } from "../schemas/fit-target";

export const convertHeartRateTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = fitTargetTypeSchema.enum.heartRate;
  if (step.target.type !== targetTypeSchema.enum.heart_rate) return;

  const value = step.target.value;
  if (value.unit === targetUnitSchema.enum.zone) {
    message.targetHrZone = value.value;
  } else if (value.unit === targetUnitSchema.enum.range) {
    message.targetValue = 0;
    message.customTargetHeartRateLow = value.min;
    message.customTargetHeartRateHigh = value.max;
  } else if (value.unit === targetUnitSchema.enum.bpm) {
    // Garmin encoding: Absolute bpm needs +100 offset
    message.targetValue = value.value + 100;
  } else if (value.unit === targetUnitSchema.enum.percent_max) {
    // Garmin encoding: Percentage max HR has no offset
    message.targetValue = value.value;
  }
};
