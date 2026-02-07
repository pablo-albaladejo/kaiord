import { durationTypeSchema, type Duration } from "@kaiord/core";

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

const convertStandardDuration = (
  duration: Duration
): Record<string, unknown> => {
  if (duration.type === durationTypeSchema.enum.time) {
    return { "@_xsi:type": "Time_t", Seconds: duration.seconds };
  }

  if (duration.type === durationTypeSchema.enum.distance) {
    return { "@_xsi:type": "Distance_t", Meters: duration.meters };
  }

  return { "@_xsi:type": "LapButton_t" };
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

  return {
    tcxDuration: convertStandardDuration(duration),
    wasRestored: false,
  };
};
