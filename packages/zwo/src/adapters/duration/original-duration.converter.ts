import { type Duration, durationTypeSchema } from "@kaiord/core";

import type { ZwiftDurationData } from "./duration.mapper";

const convertOriginalDurationType = (
  data: ZwiftDurationData
): Duration | undefined => {
  const originalDurationType = data["kaiord:originalDurationType"];
  if (originalDurationType === "distance") {
    return {
      type: durationTypeSchema.enum.distance,
      meters: data["kaiord:originalDurationMeters"] || data.Duration || 0,
    };
  }
  if (originalDurationType === "heart_rate_less_than") {
    return {
      type: durationTypeSchema.enum.heart_rate_less_than,
      bpm: data["kaiord:originalDurationBpm"] || 0,
    };
  }
  if (originalDurationType === "power_less_than") {
    return {
      type: durationTypeSchema.enum.power_less_than,
      watts: data["kaiord:originalDurationWatts"] || 0,
    };
  }
  return undefined;
};

export const convertOriginalZwiftDuration = (
  data: ZwiftDurationData
): Duration => {
  const original = convertOriginalDurationType(data);
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
