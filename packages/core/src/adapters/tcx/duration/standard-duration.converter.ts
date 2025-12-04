import {
  durationTypeSchema,
  type Duration,
} from "../../../domain/schemas/duration";
import {
  tcxDurationTypeSchema,
  type TcxDurationType,
} from "../schemas/tcx-duration";

export type TcxDurationData = {
  durationType?: string;
  seconds?: number;
  meters?: number;
  bpm?: number;
  calories?: number;
};

export type TcxDurationExtensions = {
  heartRateAbove?: number;
  heartRateBelow?: number;
  caloriesBurned?: number;
};

export type TcxDurationConversionResult = {
  duration: Duration;
  extensions?: TcxDurationExtensions;
};

export const convertStandardDuration = (
  durationType: TcxDurationType,
  data: TcxDurationData
): TcxDurationConversionResult | null => {
  if (
    durationType === tcxDurationTypeSchema.enum.Time &&
    data.seconds !== undefined
  ) {
    return {
      duration: { type: durationTypeSchema.enum.time, seconds: data.seconds },
    };
  }

  if (
    durationType === tcxDurationTypeSchema.enum.Distance &&
    data.meters !== undefined
  ) {
    return {
      duration: { type: durationTypeSchema.enum.distance, meters: data.meters },
    };
  }

  if (durationType === tcxDurationTypeSchema.enum.LapButton) {
    return {
      duration: { type: durationTypeSchema.enum.open },
    };
  }

  return null;
};
