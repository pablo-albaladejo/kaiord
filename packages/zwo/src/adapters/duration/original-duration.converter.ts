import { type Duration, durationTypeSchema, type Logger } from "@kaiord/core";

import type { ZwiftDurationData } from "./duration.mapper";

// A finite, positive number is the only physiologically meaningful restore
// value; absent/NaN/non-positive round-trip values mask corruption as data.
const isUsableValue = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value > 0;

const warnUnparseable = (
  originalDurationType: string,
  attribute: string,
  logger?: Logger
): void => {
  logger?.warn(
    "Lossy conversion: corrupted round-trip duration restored as open",
    { originalDurationType, attribute }
  );
};

const convertOriginalDurationType = (
  data: ZwiftDurationData,
  logger?: Logger
): Duration | undefined => {
  const originalDurationType = data["kaiord:originalDurationType"];
  if (originalDurationType === "distance") {
    const meters = data["kaiord:originalDurationMeters"] ?? data.Duration;
    if (isUsableValue(meters)) {
      return { type: durationTypeSchema.enum.distance, meters };
    }
    warnUnparseable(originalDurationType, "originalDurationMeters", logger);
    return { type: durationTypeSchema.enum.open };
  }
  if (originalDurationType === "heart_rate_less_than") {
    const bpm = data["kaiord:originalDurationBpm"];
    if (isUsableValue(bpm)) {
      return { type: durationTypeSchema.enum.heart_rate_less_than, bpm };
    }
    warnUnparseable(originalDurationType, "originalDurationBpm", logger);
    return { type: durationTypeSchema.enum.open };
  }
  if (originalDurationType === "power_less_than") {
    const watts = data["kaiord:originalDurationWatts"];
    if (isUsableValue(watts)) {
      return { type: durationTypeSchema.enum.power_less_than, watts };
    }
    warnUnparseable(originalDurationType, "originalDurationWatts", logger);
    return { type: durationTypeSchema.enum.open };
  }
  return undefined;
};

export const convertOriginalZwiftDuration = (
  data: ZwiftDurationData,
  logger?: Logger
): Duration => {
  const original = convertOriginalDurationType(data, logger);
  if (original) return original;

  if (data.Duration === undefined || data.Duration <= 0) {
    return { type: durationTypeSchema.enum.open };
  }

  if (data.durationType === "distance") {
    return {
      type: durationTypeSchema.enum.distance,
      meters: data.Duration,
    };
  }

  return {
    type: durationTypeSchema.enum.time,
    seconds: data.Duration,
  };
};
