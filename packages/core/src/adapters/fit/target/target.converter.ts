import { targetTypeEnum, type Target } from "../../../domain/schemas/target";
import { FIT_TARGET_TYPE } from "../constants";
import { convertCadenceTarget } from "./target-cadence.converter";
import { convertHeartRateTarget } from "./target-heart-rate.converter";
import { convertPaceTarget } from "./target-pace.converter";
import { convertPowerTarget } from "./target-power.converter";
import type { FitTargetData } from "./target.types";

export type { FitTargetData };

export const convertFitTarget = (data: FitTargetData): Target => {
  if (data.targetType === FIT_TARGET_TYPE.POWER) {
    return convertPowerTarget(data);
  }

  if (data.targetType === FIT_TARGET_TYPE.HEART_RATE) {
    return convertHeartRateTarget(data);
  }

  if (data.targetType === FIT_TARGET_TYPE.CADENCE) {
    return convertCadenceTarget(data);
  }

  if (data.targetType === FIT_TARGET_TYPE.SPEED) {
    return convertPaceTarget(data);
  }

  return { type: targetTypeEnum.enum.open };
};
