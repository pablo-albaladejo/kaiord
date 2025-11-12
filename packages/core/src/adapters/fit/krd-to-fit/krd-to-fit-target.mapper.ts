import type { WorkoutStep } from "../../../domain/schemas/workout";
import { FIT_TARGET_TYPE, KRD_TARGET_TYPE } from "../constants";
import { convertCadenceTarget } from "./krd-to-fit-target-cadence.mapper";
import { convertHeartRateTarget } from "./krd-to-fit-target-heart-rate.mapper";
import { convertPaceTarget } from "./krd-to-fit-target-pace.mapper";
import { convertPowerTarget } from "./krd-to-fit-target-power.mapper";

export const convertTarget = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  if (step.target.type === KRD_TARGET_TYPE.OPEN) {
    message.targetType = FIT_TARGET_TYPE.OPEN;
    return;
  }

  if (step.target.type === KRD_TARGET_TYPE.POWER) {
    convertPowerTarget(step, message);
  } else if (step.target.type === KRD_TARGET_TYPE.HEART_RATE) {
    convertHeartRateTarget(step, message);
  } else if (step.target.type === KRD_TARGET_TYPE.CADENCE) {
    convertCadenceTarget(step, message);
  } else if (step.target.type === KRD_TARGET_TYPE.PACE) {
    convertPaceTarget(step, message);
  }
};
