import { durationTypeEnum, type Duration } from "../../../domain/schemas/duration";
import { FIT_DURATION_TYPE } from "../constants";

export type FitDurationData = {
  durationType?: string;
  durationTime?: number;
  durationDistance?: number;
  durationHr?: number;
  durationStep?: number;
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

  return { type: durationTypeEnum.enum.open };
};
