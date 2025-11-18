import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";

const encodeHrRange = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  if (step.target.type === "heart_rate" && step.target.value.unit === "range") {
    interval["@_kaiord:hrTargetLow"] = step.target.value.min;
    interval["@_kaiord:hrTargetHigh"] = step.target.value.max;
    logger?.warn("Lossy conversion: heart rate target not supported by Zwift", {
      hrRange: { low: step.target.value.min, high: step.target.value.max },
      stepIndex: step.stepIndex,
    });
  }
};

const encodeHrBpm = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  if (step.target.type === "heart_rate" && step.target.value.unit === "bpm") {
    interval["@_kaiord:hrTargetBpm"] = step.target.value.value;
    logger?.warn("Lossy conversion: heart rate target not supported by Zwift", {
      hrBpm: step.target.value.value,
      stepIndex: step.stepIndex,
    });
  }
};

const encodeHrZone = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  if (step.target.type === "heart_rate" && step.target.value.unit === "zone") {
    interval["@_kaiord:hrTargetZone"] = step.target.value.value;
    logger?.warn("Lossy conversion: heart rate target not supported by Zwift", {
      hrZone: step.target.value.value,
      stepIndex: step.stepIndex,
    });
  }
};

const encodeHrPercentMax = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  if (
    step.target.type === "heart_rate" &&
    step.target.value.unit === "percent_max"
  ) {
    interval["@_kaiord:hrTargetPercentMax"] = step.target.value.value;
    logger?.warn("Lossy conversion: heart rate target not supported by Zwift", {
      hrPercentMax: step.target.value.value,
      stepIndex: step.stepIndex,
    });
  }
};

export const encodeHeartRateTarget = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  encodeHrRange(step, interval, logger);
  encodeHrBpm(step, interval, logger);
  encodeHrZone(step, interval, logger);
  encodeHrPercentMax(step, interval, logger);
};

export const encodeMetadata = (
  step: WorkoutStep,
  interval: Record<string, unknown>
): void => {
  if (step.name) {
    interval["@_kaiord:name"] = step.name;
  }
  if (step.intensity) {
    interval["@_kaiord:intensity"] = step.intensity;
  }
  if (step.equipment) {
    interval["@_kaiord:equipment"] = step.equipment;
  }
};
