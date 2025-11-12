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

export const convertFitDuration = (data: FitDurationData): Duration => {
  const durationType = data.durationType;

  if (
    durationType === FIT_DURATION_TYPE.TIME &&
    data.durationTime !== undefined
  ) {
    return {
      type: durationTypeEnum.enum.time,
      seconds: data.durationTime,
    };
  }

  if (
    durationType === FIT_DURATION_TYPE.DISTANCE &&
    data.durationDistance !== undefined
  ) {
    return {
      type: durationTypeEnum.enum.distance,
      meters: data.durationDistance,
    };
  }

  if (
    durationType === FIT_DURATION_TYPE.HR_LESS_THAN &&
    data.durationHr !== undefined
  ) {
    return {
      type: durationTypeEnum.enum.heart_rate_less_than,
      bpm: data.durationHr,
    };
  }

  if (
    durationType === FIT_DURATION_TYPE.REPEAT_UNTIL_HR_GREATER_THAN &&
    data.repeatHr !== undefined &&
    data.durationStep !== undefined
  ) {
    return {
      type: durationTypeEnum.enum.heart_rate_greater_than,
      bpm: data.repeatHr,
      repeatFrom: data.durationStep,
    };
  }

  return { type: durationTypeEnum.enum.open };
};
