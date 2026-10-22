import type { WorkoutStep } from "@kaiord/core";
import { targetTypeSchema } from "@kaiord/core";
import { targetUnitSchema } from "@kaiord/core";

import { fitTargetTypeSchema } from "../schemas/fit-target";
import { encodeWorkoutPower } from "../target/power-helpers";

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
    // Percent-FTP bounds are stored raw, like a single percent_ftp target.
    const encode =
      value.basis === targetUnitSchema.enum.percent_ftp
        ? Math.round
        : encodeWorkoutPower;
    message.targetValue = 0;
    message.customTargetPowerLow = encode(value.min);
    message.customTargetPowerHigh = encode(value.max);
  } else if (value.unit === targetUnitSchema.enum.watts) {
    message.targetValue = encodeWorkoutPower(value.value);
  } else if (value.unit === targetUnitSchema.enum.percent_ftp) {
    // Garmin encoding: Percentage FTP has no offset
    message.targetValue = Math.round(value.value);
  }
};
