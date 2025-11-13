import { targetTypeSchema } from "../../../domain/schemas/target";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { fitTargetTypeSchema } from "../schemas/fit-target";
import { convertCadenceTarget } from "./krd-to-fit-target-cadence.mapper";
import { convertHeartRateTarget } from "./krd-to-fit-target-heart-rate.mapper";
import { convertPaceTarget } from "./krd-to-fit-target-pace.mapper";
import { convertPowerTarget } from "./krd-to-fit-target-power.mapper";

export const convertTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  if (step.target.type === targetTypeSchema.enum.open) {
    message.targetType = fitTargetTypeSchema.enum.open;
    return;
  }

  if (step.target.type === targetTypeSchema.enum.power) {
    convertPowerTarget(step, message);
  } else if (step.target.type === targetTypeSchema.enum.heart_rate) {
    convertHeartRateTarget(step, message);
  } else if (step.target.type === targetTypeSchema.enum.cadence) {
    convertCadenceTarget(step, message);
  } else if (step.target.type === targetTypeSchema.enum.pace) {
    convertPaceTarget(step, message);
  }
};
