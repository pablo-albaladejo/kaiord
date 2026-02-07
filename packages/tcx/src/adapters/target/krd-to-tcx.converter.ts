import { targetTypeSchema, type Target } from "@kaiord/core";
import { convertCadenceTargetToTcx } from "./cadence.converter";
import { convertHeartRateZone } from "./heart-rate.converter";
import { convertPaceTargetToTcx } from "./pace.converter";

export type KrdTargetData = {
  target: Target;
  sport?: string;
};

const convertHeartRateTargetToTcx = (
  target: Target
): Record<string, unknown> => {
  if (target.type !== "heart_rate") {
    return { "@_xsi:type": "None_t" };
  }

  return convertHeartRateZone(target.value);
};

export const convertKrdTargetToTcx = (
  data: KrdTargetData
): Record<string, unknown> => {
  const { target, sport } = data;

  if (target.type === targetTypeSchema.enum.heart_rate) {
    return convertHeartRateTargetToTcx(target);
  }

  if (target.type === targetTypeSchema.enum.pace) {
    return convertPaceTargetToTcx(target.value);
  }

  if (target.type === targetTypeSchema.enum.cadence) {
    return convertCadenceTargetToTcx(target.value, sport);
  }

  if (target.type === targetTypeSchema.enum.open) {
    return { "@_xsi:type": "None_t" };
  }

  return { "@_xsi:type": "None_t" };
};
