import {
  durationTypeSchema,
  type Duration,
} from "../../../domain/schemas/duration";
import type { Logger } from "../../../ports/logger";
import { tcxDurationTypeSchema } from "../schemas/tcx-duration";

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

  const durationType = tcxDuration["@_xsi:type"] as string | undefined;

  if (durationType === "Time_t") {
    const seconds = tcxDuration.Seconds as number | undefined;
    if (typeof seconds === "number" && seconds > 0) {
      return { type: "time", seconds };
    }
  }

  if (durationType === "Distance_t") {
    const meters = tcxDuration.Meters as number | undefined;
    if (typeof meters === "number" && meters > 0) {
      return { type: "distance", meters };
    }
  }

  if (durationType === "LapButton_t") {
    return { type: "open" };
  }

  logger.warn("Unsupported duration type", { durationType });
  return null;
};
