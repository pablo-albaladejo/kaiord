import {
  durationTypeEnum,
  type Duration,
} from "../../../domain/schemas/duration";
import { FIT_DURATION_TYPE } from "../constants";

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
      type: durationTypeEnum.enum.time,
      seconds: data.durationTime,
    };
  }
  return null;
};

const convertDistanceDuration = (data: FitDurationData): Duration | null => {
  if (data.durationDistance !== undefined) {
    return {
      type: durationTypeEnum.enum.distance,
      meters: data.durationDistance,
    };
  }
  return null;
};

const convertHeartRateLessThan = (data: FitDurationData): Duration | null => {
  if (data.durationHr !== undefined) {
    return {
      type: durationTypeEnum.enum.heart_rate_less_than,
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
      type: durationTypeEnum.enum.heart_rate_greater_than,
      bpm: data.repeatHr,
      repeatFrom: data.durationStep,
    };
  }
  return null;
};

export const convertFitDuration = (data: FitDurationData): Duration => {
  const durationType = data.durationType;

  if (durationType === FIT_DURATION_TYPE.TIME) {
    return convertTimeDuration(data) || { type: durationTypeEnum.enum.open };
  }

  if (durationType === FIT_DURATION_TYPE.DISTANCE) {
    return (
      convertDistanceDuration(data) || { type: durationTypeEnum.enum.open }
    );
  }

  if (durationType === FIT_DURATION_TYPE.HR_LESS_THAN) {
    return (
      convertHeartRateLessThan(data) || { type: durationTypeEnum.enum.open }
    );
  }

  if (durationType === FIT_DURATION_TYPE.REPEAT_UNTIL_HR_GREATER_THAN) {
    return (
      convertHeartRateGreaterThan(data) || { type: durationTypeEnum.enum.open }
    );
  }

  return { type: durationTypeEnum.enum.open };
};
