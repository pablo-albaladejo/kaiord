import type { WorkoutStep } from "@kaiord/core";
import type { Logger } from "@kaiord/core";

// heart_rate_less_than / power_*_than have no Zwift equivalent; emit a neutral
// 5-min block and round-trip the real type via @_kaiord:originalDurationType.
const UNSUPPORTED_DURATION_FALLBACK_SECONDS = 300;

export const encodeDuration = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  if (step.duration.type === "time") {
    interval["@_Duration"] = step.duration.seconds;
  } else if (step.duration.type === "distance") {
    interval["@_Duration"] = step.duration.meters;
    interval["@_kaiord:originalDurationType"] = "distance";
    interval["@_kaiord:originalDurationMeters"] = step.duration.meters;

    logger?.warn("Lossy conversion: distance duration converted to time", {
      originalMeters: step.duration.meters,
      convertedSeconds: step.duration.meters,
      stepIndex: step.stepIndex,
    });
  } else if (step.duration.type === "open") {
    interval["@_Duration"] = 0;
  } else {
    interval["@_Duration"] = UNSUPPORTED_DURATION_FALLBACK_SECONDS;
    interval["@_kaiord:originalDurationType"] = step.duration.type;

    if ("bpm" in step.duration) {
      interval["@_kaiord:originalDurationBpm"] = step.duration.bpm;
    } else if ("watts" in step.duration) {
      interval["@_kaiord:originalDurationWatts"] = step.duration.watts;
    }

    logger?.warn("Lossy conversion: unsupported duration type", {
      originalType: step.duration.type,
      fallbackSeconds: UNSUPPORTED_DURATION_FALLBACK_SECONDS,
      stepIndex: step.stepIndex,
    });
  }
};
