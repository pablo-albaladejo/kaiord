import { targetTypeSchema, type Target } from "@kaiord/core";
import { fitTargetTypeSchema } from "../schemas/fit-target";
import { convertCadenceTarget } from "./target-cadence.converter";
import { convertHeartRateTarget } from "./target-heart-rate.converter";
import { convertPaceTarget } from "./target-pace.converter";
import { convertPowerTarget } from "./target-power.converter";
import { convertStrokeTypeTarget } from "./target-stroke.converter";
import type { FitTargetData } from "./target.types";

export type { FitTargetData };

export const convertFitTarget = (data: FitTargetData): Target => {
  if (data.targetType === fitTargetTypeSchema.enum.power) {
    return convertPowerTarget(data);
  }

  if (data.targetType === fitTargetTypeSchema.enum.heartRate) {
    return convertHeartRateTarget(data);
  }

  if (data.targetType === fitTargetTypeSchema.enum.cadence) {
    return convertCadenceTarget(data);
  }

  if (data.targetType === fitTargetTypeSchema.enum.speed) {
    return convertPaceTarget(data);
  }

  if (data.targetType === fitTargetTypeSchema.enum.swimStroke) {
    return convertStrokeTypeTarget(data);
  }

  return { type: targetTypeSchema.enum.open };
};
