import {
  durationTypeSchema,
  type Duration,
} from "../../../domain/schemas/duration";
import { fitDurationTypeSchema } from "../schemas/fit-duration";

export type FitDurationData = {
  durationType?: string;
  durationTime?: number;
  durationDistance?: number;
  durationHr?: number;
  durationStep?: number;
  repeatHr?: number;
};

const convertTimeDuration = (data: FitDurationData): Duration | null => {
  if (data.durationTime !== undefined) {
    return {
      type: durationTypeSchema.enum.time,
      seconds: data.durationTime,
    };
  }
  return null;
};

const convertDistanceDuration = (data: FitDurationData): Duration | null => {
  if (data.durationDistance !== undefined) {
    return {
      type: durationTypeSchema.enum.distance,
      meters: data.durationDistance,
    };
  }
  return null;
};

const convertHeartRateLessThan = (data: FitDurationData): Duration | null => {
  if (data.durationHr !== undefined) {
    return {
      type: durationTypeSchema.enum.heart_rate_less_than,
      bpm: data.durationHr,
    };
  }
  return null;
};

const convertHeartRateGreaterThan = (
  data: FitDurationData
): Duration | null => {
  if (data.repeatHr !== undefined && data.durationStep !== undefined) {
    return {
      type: durationTypeSchema.enum.repeat_until_heart_rate_greater_than,
      bpm: data.repeatHr,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertFitDuration = (data: FitDurationData): Duration => {
  // Validate at boundary
  const result = fitDurationTypeSchema.safeParse(data.durationType);

  if (!result.success) {
    return { type: durationTypeSchema.enum.open };
  }

  const durationType = result.data;

  if (durationType === fitDurationTypeSchema.enum.time) {
    return convertTimeDuration(data) || { type: durationTypeSchema.enum.open };
  }

  if (durationType === fitDurationTypeSchema.enum.distance) {
    return (
      convertDistanceDuration(data) || { type: durationTypeSchema.enum.open }
    );
  }

  if (durationType === fitDurationTypeSchema.enum.hrLessThan) {
    return (
      convertHeartRateLessThan(data) || { type: durationTypeSchema.enum.open }
    );
  }

  if (durationType === fitDurationTypeSchema.enum.repeatUntilHrGreaterThan) {
    return (
      convertHeartRateGreaterThan(data) || { type: durationTypeSchema.enum.open }
    );
  }

  return { type: durationTypeSchema.enum.open };
};
