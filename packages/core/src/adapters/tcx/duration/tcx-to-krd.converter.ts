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

const convertStandardDuration = (
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
    return { duration: { type: durationTypeSchema.enum.open } };
  }

  return null;
};

const convertExtendedDuration = (
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

export const convertTcxDuration = (
  data: TcxDurationData
): TcxDurationConversionResult => {
  const result = tcxDurationTypeSchema.safeParse(data.durationType);

  if (!result.success) {
    return { duration: { type: durationTypeSchema.enum.open } };
  }

  const standardResult = convertStandardDuration(result.data, data);
  if (standardResult) return standardResult;

  const extendedResult = convertExtendedDuration(result.data, data);
  if (extendedResult) return extendedResult;

  return { duration: { type: durationTypeSchema.enum.open } };
};
