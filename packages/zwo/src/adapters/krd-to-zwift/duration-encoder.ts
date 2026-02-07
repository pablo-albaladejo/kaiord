import type { WorkoutStep } from "@kaiord/core";
import type { Logger } from "@kaiord/core";

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
    interval["@_Duration"] = 300;
    interval["@_kaiord:originalDurationType"] = step.duration.type;

    if ("bpm" in step.duration) {
      interval["@_kaiord:originalDurationBpm"] = step.duration.bpm;
    } else if ("watts" in step.duration) {
      interval["@_kaiord:originalDurationWatts"] = step.duration.watts;
    }

    logger?.warn("Lossy conversion: unsupported duration type", {
      originalType: step.duration.type,
      fallbackSeconds: 300,
      stepIndex: step.stepIndex,
    });
  }
};
