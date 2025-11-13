import { targetTypeEnum, type Target } from "../../../domain/schemas/target";
import { fitTargetTypeEnum } from "../schemas/fit-target";
import { convertCadenceTarget } from "./target-cadence.converter";
import { convertHeartRateTarget } from "./target-heart-rate.converter";
import { convertPaceTarget } from "./target-pace.converter";
import { convertPowerTarget } from "./target-power.converter";
import { convertStrokeTypeTarget } from "./target-stroke.converter";
import type { FitTargetData } from "./target.types";

export type { FitTargetData };

export const convertFitTarget = (data: FitTargetData): Target => {
  if (data.targetType === fitTargetTypeEnum.enum.power) {
    return convertPowerTarget(data);
  }

  if (data.targetType === fitTargetTypeEnum.enum.heartRate) {
    return convertHeartRateTarget(data);
  }

  if (data.targetType === fitTargetTypeEnum.enum.cadence) {
    return convertCadenceTarget(data);
  }

  if (data.targetType === fitTargetTypeEnum.enum.speed) {
    return convertPaceTarget(data);
  }

  if (data.targetType === fitTargetTypeEnum.enum.swimStroke) {
    return convertStrokeTypeTarget(data);
  }

  return { type: targetTypeEnum.enum.open };
};
