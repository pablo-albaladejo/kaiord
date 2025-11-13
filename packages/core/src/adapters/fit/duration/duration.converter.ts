import {
  durationTypeSchema,
  type Duration,
} from "../../../domain/schemas/duration";
import { fitDurationTypeSchema } from "../schemas/fit-duration";
import {
  convertCaloriesDuration,
  convertDistanceDuration,
  convertHeartRateGreaterThan,
  convertHeartRateLessThan,
  convertPowerGreaterThan,
  convertPowerLessThan,
  convertTimeDuration,
} from "./duration-converters";
import {
  convertRepeatUntilCalories,
  convertRepeatUntilDistance,
  convertRepeatUntilHrLessThan,
  convertRepeatUntilPowerGreaterThan,
  convertRepeatUntilPowerLessThan,
  convertRepeatUntilTime,
} from "./repeat-duration-converters";

export type FitDurationData = {
  durationType?: string;
  durationTime?: number;
  durationDistance?: number;
  durationHr?: number;
  durationStep?: number;
  repeatHr?: number;
  durationCalories?: number;
  durationPower?: number;
};

const DURATION_CONVERTERS: Record<
  string,
  (data: FitDurationData) => Duration | null
> = {
  [fitDurationTypeSchema.enum.time]: convertTimeDuration,
  [fitDurationTypeSchema.enum.distance]: convertDistanceDuration,
  [fitDurationTypeSchema.enum.hrLessThan]: convertHeartRateLessThan,
  [fitDurationTypeSchema.enum.repeatUntilHrGreaterThan]:
    convertHeartRateGreaterThan,
  [fitDurationTypeSchema.enum.calories]: convertCaloriesDuration,
  [fitDurationTypeSchema.enum.powerLessThan]: convertPowerLessThan,
  [fitDurationTypeSchema.enum.powerGreaterThan]: convertPowerGreaterThan,
  [fitDurationTypeSchema.enum.repeatUntilTime]: convertRepeatUntilTime,
  [fitDurationTypeSchema.enum.repeatUntilDistance]: convertRepeatUntilDistance,
  [fitDurationTypeSchema.enum.repeatUntilCalories]: convertRepeatUntilCalories,
  [fitDurationTypeSchema.enum.repeatUntilHrLessThan]:
    convertRepeatUntilHrLessThan,
  [fitDurationTypeSchema.enum.repeatUntilPowerLessThan]:
    convertRepeatUntilPowerLessThan,
  [fitDurationTypeSchema.enum.repeatUntilPowerGreaterThan]:
    convertRepeatUntilPowerGreaterThan,
};

export const convertFitDuration = (data: FitDurationData): Duration => {
  const result = fitDurationTypeSchema.safeParse(data.durationType);

  if (!result.success) {
    return { type: durationTypeSchema.enum.open };
  }

  const converter = DURATION_CONVERTERS[result.data];
  if (converter) {
    return converter(data) || { type: durationTypeSchema.enum.open };
  }

  return { type: durationTypeSchema.enum.open };
};
