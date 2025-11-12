import type { Target } from "../../domain/schemas/target";
import {
  FIT_TARGET_TYPE,
  KRD_TARGET_TYPE,
  KRD_TARGET_UNIT,
  type KRDTargetType,
} from "./constants";
import type { FitWorkoutStep } from "./types";

export const mapTarget = (step: FitWorkoutStep): Target => {
  const targetType = step.targetType;

  if (
    targetType === FIT_TARGET_TYPE.POWER &&
    step.targetPowerZone !== undefined
  ) {
    return {
      type: KRD_TARGET_TYPE.POWER,
      value: {
        unit: KRD_TARGET_UNIT.ZONE,
        value: step.targetPowerZone,
      },
    };
  }

  if (
    targetType === FIT_TARGET_TYPE.HEART_RATE &&
    step.targetHrZone !== undefined
  ) {
    return {
      type: KRD_TARGET_TYPE.HEART_RATE,
      value: {
        unit: KRD_TARGET_UNIT.ZONE,
        value: step.targetHrZone,
      },
    };
  }

  if (
    targetType === FIT_TARGET_TYPE.CADENCE &&
    step.targetCadenceZone !== undefined
  ) {
    return {
      type: KRD_TARGET_TYPE.CADENCE,
      value: {
        unit: KRD_TARGET_UNIT.RPM,
        value: step.targetCadenceZone,
      },
    };
  }

  if (
    targetType === FIT_TARGET_TYPE.SPEED &&
    step.targetSpeedZone !== undefined
  ) {
    return {
      type: KRD_TARGET_TYPE.PACE,
      value: {
        unit: KRD_TARGET_UNIT.MPS,
        value: step.targetSpeedZone,
      },
    };
  }

  return { type: KRD_TARGET_TYPE.OPEN };
};

export const mapTargetType = (
  fitTargetType: string | undefined
): KRDTargetType => {
  if (fitTargetType === FIT_TARGET_TYPE.POWER) return KRD_TARGET_TYPE.POWER;
  if (fitTargetType === FIT_TARGET_TYPE.HEART_RATE)
    return KRD_TARGET_TYPE.HEART_RATE;
  if (fitTargetType === FIT_TARGET_TYPE.CADENCE) return KRD_TARGET_TYPE.CADENCE;
  if (fitTargetType === FIT_TARGET_TYPE.SPEED) return KRD_TARGET_TYPE.PACE;
  return KRD_TARGET_TYPE.OPEN;
};
