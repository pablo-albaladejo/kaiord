import { durationTypeSchema, type Duration } from "@kaiord/core";

export type ZwiftIntervalData = {
  "@_Duration"?: number;
  "@_OnDuration"?: number;
  "@_OffDuration"?: number;
};

// Zwift → KRD converters
export const convertZwiftTimeDuration = (seconds: number): Duration => {
  if (seconds <= 0) {
    return { type: durationTypeSchema.enum.open };
  }

  return {
    type: durationTypeSchema.enum.time,
    seconds,
  };
};

export const convertZwiftDistanceDuration = (meters: number): Duration => {
  if (meters <= 0) {
    return { type: durationTypeSchema.enum.open };
  }

  return {
    type: durationTypeSchema.enum.distance,
    meters,
  };
};

export const convertZwiftDuration = (
  durationValue: number | undefined,
  isDistanceBased: boolean
): Duration => {
  if (durationValue === undefined || durationValue <= 0) {
    return { type: durationTypeSchema.enum.open };
  }

  if (isDistanceBased) {
    return convertZwiftDistanceDuration(durationValue);
  }

  return convertZwiftTimeDuration(durationValue);
};

// KRD → Zwift converters
export const convertKrdTimeDurationToZwift = (duration: Duration): number => {
  if (duration.type !== durationTypeSchema.enum.time) {
    return 0;
  }

  return duration.seconds;
};

export const convertKrdDistanceDurationToZwift = (
  duration: Duration
): number => {
  if (duration.type !== durationTypeSchema.enum.distance) {
    return 0;
  }

  return duration.meters;
};

export const convertKrdDurationToZwift = (
  duration: Duration,
  isDistanceBased: boolean
): number => {
  if (duration.type === durationTypeSchema.enum.open) {
    return 0;
  }

  if (isDistanceBased) {
    return convertKrdDistanceDurationToZwift(duration);
  }

  return convertKrdTimeDurationToZwift(duration);
};
