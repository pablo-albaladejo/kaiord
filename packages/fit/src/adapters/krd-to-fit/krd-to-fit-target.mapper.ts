import { targetTypeSchema } from "@kaiord/core";
import type { WorkoutStep } from "@kaiord/core";
import { fitTargetTypeSchema } from "../schemas/fit-target";
import { convertCadenceTarget } from "./krd-to-fit-target-cadence.mapper";
import { convertHeartRateTarget } from "./krd-to-fit-target-heart-rate.mapper";
import { convertPaceTarget } from "./krd-to-fit-target-pace.mapper";
import { convertPowerTarget } from "./krd-to-fit-target-power.mapper";
import { convertStrokeTarget } from "./krd-to-fit-target-stroke.converter";

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
  } else if (step.target.type === targetTypeSchema.enum.stroke_type) {
    convertStrokeTarget(step, message);
  }
};
