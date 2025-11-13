import { targetTypeEnum, targetUnitEnum } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { fitTargetTypeEnum } from "../schemas/fit-target";

export const convertPowerTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  message.targetType = fitTargetTypeEnum.enum.power;
  if (step.target.type !== targetTypeEnum.enum.power) return;

  const value = step.target.value;
  if (value.unit === targetUnitEnum.enum.zone) {
    message.targetPowerZone = value.value;
  } else if (value.unit === targetUnitEnum.enum.range) {
    message.targetValue = 0;
    message.customTargetPowerLow = value.min;
    message.customTargetPowerHigh = value.max;
  } else if (value.unit === targetUnitEnum.enum.watts) {
    // Garmin encoding: Absolute watts need +1000 offset
    message.targetValue = value.value + 1000;
  } else if (value.unit === targetUnitEnum.enum.percent_ftp) {
    // Garmin encoding: Percentage FTP has no offset
    message.targetValue = value.value;
  }
};
