import { durationTypeSchema, type Duration } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { tcxDurationTypeSchema } from "../schemas/tcx-duration";
import { restoreKaiordDuration } from "./duration-kaiord-restorer";
import { convertStandardTcxDuration } from "./duration-standard-converter";

export type TcxDurationData = {
  durationType?: string;
  seconds?: number;
  meters?: number;
};

export const mapTcxDuration = (data: TcxDurationData): Duration => {
  const result = tcxDurationTypeSchema.safeParse(data.durationType);

  if (!result.success) {
    return { type: durationTypeSchema.enum.open };
  }

  // Time duration
  if (
    result.data === tcxDurationTypeSchema.enum.Time &&
    data.seconds !== undefined
  ) {
    return {
      type: durationTypeSchema.enum.time,
      seconds: data.seconds,
    };
  }

  // Distance duration
  if (
    result.data === tcxDurationTypeSchema.enum.Distance &&
    data.meters !== undefined
  ) {
    return {
      type: durationTypeSchema.enum.distance,
      meters: data.meters,
    };
  }

  // LapButton duration
  if (result.data === tcxDurationTypeSchema.enum.LapButton) {
    return {
      type: durationTypeSchema.enum.open,
    };
  }

  // Default to open for unsupported types (HeartRateAbove, HeartRateBelow, CaloriesBurned)
  // These will be handled by the converter and stored in extensions
  return { type: durationTypeSchema.enum.open };
};

export const convertTcxDuration = (
  tcxDuration: Record<string, unknown> | undefined,
  logger: Logger
): Duration | null => {
  if (!tcxDuration) {
    return null;
  }

  // First check for kaiord attributes to restore advanced duration types
  const kaiordDuration = restoreKaiordDuration(tcxDuration, logger);
  if (kaiordDuration) {
    return kaiordDuration;
  }

  // Then check for standard TCX duration types
  const standardDuration = convertStandardTcxDuration(tcxDuration);
  if (standardDuration) {
    return standardDuration;
  }

  const durationType = tcxDuration["@_xsi:type"] as string | undefined;
  logger.warn("Unsupported duration type", { durationType });
  return null;
};

// KRD → TCX duration mappers

export type TcxDurationElement = Record<string, unknown>;

export const mapTimeDurationToTcx = (seconds: number): TcxDurationElement => {
  return {
    "@_xsi:type": "Time_t",
    Seconds: seconds,
  };
};

export const mapDistanceDurationToTcx = (
  meters: number
): TcxDurationElement => {
  return {
    "@_xsi:type": "Distance_t",
    Meters: meters,
  };
};

export const mapOpenDurationToTcx = (): TcxDurationElement => {
  return {
    "@_xsi:type": "LapButton_t",
  };
};
