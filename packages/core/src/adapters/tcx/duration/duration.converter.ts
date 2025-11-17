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

// KRD → TCX duration converters

export type KrdDurationConversionResult = {
  tcxDuration: Record<string, unknown>;
  wasRestored: boolean;
};

export const convertKrdDurationToTcx = (
  duration: Duration,
  extensions?: Record<string, unknown>
): KrdDurationConversionResult => {
  // Check if we can restore TCX-specific duration from extensions
  if (extensions) {
    const restored = restoreTcxDurationFromExtensions(extensions);
    if (restored) {
      return { tcxDuration: restored, wasRestored: true };
    }
  }

  // Convert standard KRD duration types
  if (duration.type === durationTypeSchema.enum.time) {
    return {
      tcxDuration: {
        "@_xsi:type": "Time_t",
        Seconds: duration.seconds,
      },
      wasRestored: false,
    };
  }

  if (duration.type === durationTypeSchema.enum.distance) {
    return {
      tcxDuration: {
        "@_xsi:type": "Distance_t",
        Meters: duration.meters,
      },
      wasRestored: false,
    };
  }

  if (duration.type === durationTypeSchema.enum.open) {
    return {
      tcxDuration: {
        "@_xsi:type": "LapButton_t",
      },
      wasRestored: false,
    };
  }

  // Default to LapButton for unsupported KRD duration types
  return {
    tcxDuration: {
      "@_xsi:type": "LapButton_t",
    },
    wasRestored: false,
  };
};

const restoreTcxDurationFromExtensions = (
  extensions: Record<string, unknown>
): Record<string, unknown> | null => {
  // Check for HeartRateAbove in extensions
  if (
    "heartRateAbove" in extensions &&
    typeof extensions.heartRateAbove === "number"
  ) {
    return {
      "@_xsi:type": "HeartRateAbove_t",
      HeartRate: {
        "@_xsi:type": "HeartRateAbove_t",
        Value: extensions.heartRateAbove,
      },
    };
  }

  // Check for HeartRateBelow in extensions
  if (
    "heartRateBelow" in extensions &&
    typeof extensions.heartRateBelow === "number"
  ) {
    return {
      "@_xsi:type": "HeartRateBelow_t",
      HeartRate: {
        "@_xsi:type": "HeartRateBelow_t",
        Value: extensions.heartRateBelow,
      },
    };
  }

  // Check for CaloriesBurned in extensions
  if (
    "caloriesBurned" in extensions &&
    typeof extensions.caloriesBurned === "number"
  ) {
    return {
      "@_xsi:type": "CaloriesBurned_t",
      Calories: extensions.caloriesBurned,
    };
  }

  return null;
};
