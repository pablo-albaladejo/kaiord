import type { Duration } from "@kaiord/core";

const addKaiordAttributes = (
  tcxDuration: Record<string, unknown>,
  duration: Duration
): void => {
  if (duration.type === "heart_rate_less_than" && duration.bpm !== undefined) {
    tcxDuration["@_kaiord:originalDurationType"] = "heart_rate_less_than";
    tcxDuration["@_kaiord:originalDurationBpm"] = duration.bpm;
  } else if (
    duration.type === "power_less_than" &&
    duration.watts !== undefined
  ) {
    tcxDuration["@_kaiord:originalDurationType"] = "power_less_than";
    tcxDuration["@_kaiord:originalDurationWatts"] = duration.watts;
  } else if (
    duration.type === "power_greater_than" &&
    duration.watts !== undefined
  ) {
    tcxDuration["@_kaiord:originalDurationType"] = "power_greater_than";
    tcxDuration["@_kaiord:originalDurationWatts"] = duration.watts;
  } else if (duration.type === "calories" && duration.calories !== undefined) {
    tcxDuration["@_kaiord:originalDurationType"] = "calories";
    tcxDuration["@_kaiord:originalDurationCalories"] = duration.calories;
  }
};

export const convertDurationToTcx = (step: {
  duration: Duration;
}): Record<string, unknown> => {
  const duration = step.duration;

  // Standard TCX duration types
  if (duration.type === "time") {
    return {
      "@_xsi:type": "Time_t",
      Seconds: duration.seconds,
    };
  }

  if (duration.type === "distance") {
    return {
      "@_xsi:type": "Distance_t",
      Meters: duration.meters,
    };
  }

  // For advanced duration types not natively supported by TCX,
  // use LapButton_t and preserve original type in kaiord attributes
  const tcxDuration: Record<string, unknown> = {
    "@_xsi:type": "LapButton_t",
  };

  addKaiordAttributes(tcxDuration, duration);

  return tcxDuration;
};
