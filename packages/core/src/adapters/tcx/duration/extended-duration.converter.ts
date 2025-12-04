import { durationTypeSchema } from "../../../domain/schemas/duration";
import {
  tcxDurationTypeSchema,
  type TcxDurationType,
} from "../schemas/tcx-duration";
import type {
  TcxDurationConversionResult,
  TcxDurationData,
} from "./standard-duration.converter";

export const convertExtendedDuration = (
  durationType: TcxDurationType,
  data: TcxDurationData
): TcxDurationConversionResult | null => {
  if (
    durationType === tcxDurationTypeSchema.enum.HeartRateAbove &&
    data.bpm !== undefined
  ) {
    return {
      duration: { type: durationTypeSchema.enum.open },
      extensions: { heartRateAbove: data.bpm },
    };
  }

  if (
    durationType === tcxDurationTypeSchema.enum.HeartRateBelow &&
    data.bpm !== undefined
  ) {
    return {
      duration: { type: durationTypeSchema.enum.open },
      extensions: { heartRateBelow: data.bpm },
    };
  }

  if (
    durationType === tcxDurationTypeSchema.enum.CaloriesBurned &&
    data.calories !== undefined
  ) {
    return {
      duration: { type: durationTypeSchema.enum.open },
      extensions: { caloriesBurned: data.calories },
    };
  }

  return null;
};
