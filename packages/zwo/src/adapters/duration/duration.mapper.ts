import { durationTypeSchema, type Duration } from "@kaiord/core";

export type ZwiftDurationData = {
  Duration?: number;
  durationType?: "time" | "distance";
  // Kaiord round-trip attributes
  "kaiord:originalDurationType"?: string;
  "kaiord:originalDurationMeters"?: number;
  "kaiord:originalDurationBpm"?: number;
  "kaiord:originalDurationWatts"?: number;
};

const mapOriginalDurationType = (
  data: ZwiftDurationData
): Duration | undefined => {
  const orig = data["kaiord:originalDurationType"];
  if (orig === "distance") {
    return {
      type: durationTypeSchema.enum.distance,
      meters: data["kaiord:originalDurationMeters"] || data.Duration || 0,
    };
  }
  if (orig === "heart_rate_less_than") {
    return {
      type: durationTypeSchema.enum.heart_rate_less_than,
      bpm: data["kaiord:originalDurationBpm"] || 0,
    };
  }
  if (orig === "power_less_than") {
    return {
      type: durationTypeSchema.enum.power_less_than,
      watts: data["kaiord:originalDurationWatts"] || 0,
    };
  }
  return undefined;
};

export const mapZwiftDuration = (data: ZwiftDurationData): Duration => {
  const original = mapOriginalDurationType(data);
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

// KRD → Zwift mappers
export const mapKrdTimeDurationToZwift = (seconds: number): number => {
  return seconds;
};

export const mapKrdDistanceDurationToZwift = (meters: number): number => {
  return meters;
};
