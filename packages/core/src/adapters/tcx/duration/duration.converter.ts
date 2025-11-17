import {
  durationTypeSchema,
  type Duration,
} from "../../../domain/schemas/duration";
import { tcxDurationTypeSchema } from "../schemas/tcx-duration";

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

export const convertTcxDuration = (
  data: TcxDurationData
): TcxDurationConversionResult => {
  const result = tcxDurationTypeSchema.safeParse(data.durationType);

  if (!result.success) {
    return { duration: { type: durationTypeSchema.enum.open } };
  }

  // Time duration
  if (
    result.data === tcxDurationTypeSchema.enum.Time &&
    data.seconds !== undefined
  ) {
    return {
      duration: {
        type: durationTypeSchema.enum.time,
        seconds: data.seconds,
      },
    };
  }

  // Distance duration
  if (
    result.data === tcxDurationTypeSchema.enum.Distance &&
    data.meters !== undefined
  ) {
    return {
      duration: {
        type: durationTypeSchema.enum.distance,
        meters: data.meters,
      },
    };
  }

  // LapButton duration
  if (result.data === tcxDurationTypeSchema.enum.LapButton) {
    return {
      duration: {
        type: durationTypeSchema.enum.open,
      },
    };
  }

  // HeartRateAbove - store in extensions
  if (
    result.data === tcxDurationTypeSchema.enum.HeartRateAbove &&
    data.bpm !== undefined
  ) {
    return {
      duration: {
        type: durationTypeSchema.enum.open,
      },
      extensions: {
        heartRateAbove: data.bpm,
      },
    };
  }

  // HeartRateBelow - store in extensions
  if (
    result.data === tcxDurationTypeSchema.enum.HeartRateBelow &&
    data.bpm !== undefined
  ) {
    return {
      duration: {
        type: durationTypeSchema.enum.open,
      },
      extensions: {
        heartRateBelow: data.bpm,
      },
    };
  }

  // CaloriesBurned - store in extensions
  if (
    result.data === tcxDurationTypeSchema.enum.CaloriesBurned &&
    data.calories !== undefined
  ) {
    return {
      duration: {
        type: durationTypeSchema.enum.open,
      },
      extensions: {
        caloriesBurned: data.calories,
      },
    };
  }

  // Default to open for any other cases
  return { duration: { type: durationTypeSchema.enum.open } };
};
