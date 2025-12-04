import { targetTypeSchema } from "../../../domain/schemas/target";
import { targetUnitSchema } from "../../../domain/schemas/target-values";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { fitTargetTypeSchema } from "../schemas/fit-target";

export const convertPowerTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = fitTargetTypeSchema.enum.power;
  if (step.target.type !== targetTypeSchema.enum.power) return;

  const value = step.target.value;
  if (value.unit === targetUnitSchema.enum.zone) {
    message.targetPowerZone = value.value;
  } else if (value.unit === targetUnitSchema.enum.range) {
    message.targetValue = 0;
    message.customTargetPowerLow = value.min;
    message.customTargetPowerHigh = value.max;
  } else if (value.unit === targetUnitSchema.enum.watts) {
    // Garmin encoding: Absolute watts need +1000 offset
    message.targetValue = value.value + 1000;
  } else if (value.unit === targetUnitSchema.enum.percent_ftp) {
    // Garmin encoding: Percentage FTP has no offset
    message.targetValue = value.value;
  }
};
