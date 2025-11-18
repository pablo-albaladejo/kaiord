import {
  durationTypeSchema,
  type Duration,
} from "../../../domain/schemas/duration";

export type ZwiftDurationData = {
  Duration?: number;
  durationType?: "time" | "distance";
};

export const mapZwiftDuration = (data: ZwiftDurationData): Duration => {
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
