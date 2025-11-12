import type { Duration } from "../../domain/schemas/duration";
import {
  FIT_DURATION_TYPE,
  KRD_DURATION_TYPE,
  type KRDDurationType,
} from "./constants";
import type { FitWorkoutStep } from "./types";

export const mapDuration = (step: FitWorkoutStep): Duration => {
  const durationType = step.durationType;

  if (
    durationType === FIT_DURATION_TYPE.TIME &&
    step.durationTime !== undefined
  ) {
    return {
      type: KRD_DURATION_TYPE.TIME,
      seconds: step.durationTime,
    };
  }

  if (
    durationType === FIT_DURATION_TYPE.DISTANCE &&
    step.durationDistance !== undefined
  ) {
    return {
      type: KRD_DURATION_TYPE.DISTANCE,
      meters: step.durationDistance,
    };
  }

  return { type: KRD_DURATION_TYPE.OPEN };
};

export const mapDurationType = (
  fitDurationType: string | undefined
): KRDDurationType => {
  if (fitDurationType === FIT_DURATION_TYPE.TIME) return KRD_DURATION_TYPE.TIME;
  if (fitDurationType === FIT_DURATION_TYPE.DISTANCE)
    return KRD_DURATION_TYPE.DISTANCE;
  return KRD_DURATION_TYPE.OPEN;
};
