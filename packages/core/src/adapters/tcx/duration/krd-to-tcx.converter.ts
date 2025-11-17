import {
  durationTypeSchema,
  type Duration,
} from "../../../domain/schemas/duration";

export type KrdDurationConversionResult = {
  tcxDuration: Record<string, unknown>;
  wasRestored: boolean;
};

const restoreTcxDurationFromExtensions = (
  extensions: Record<string, unknown>
): Record<string, unknown> | null => {
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

export const convertKrdDurationToTcx = (
  duration: Duration,
  extensions?: Record<string, unknown>
): KrdDurationConversionResult => {
  if (extensions) {
    const restored = restoreTcxDurationFromExtensions(extensions);
    if (restored) {
      return { tcxDuration: restored, wasRestored: true };
    }
  }

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

  return {
    tcxDuration: {
      "@_xsi:type": "LapButton_t",
    },
    wasRestored: false,
  };
};
