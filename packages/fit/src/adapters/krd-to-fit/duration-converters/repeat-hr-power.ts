import type { Duration } from "@kaiord/core";
import { durationTypeSchema } from "@kaiord/core";

import { fitDurationTypeSchema } from "../../schemas/fit-duration";
import { encodeWorkoutHeartRate } from "../../target/heart-rate-helpers";
import { encodeWorkoutPower } from "../../target/power-helpers";

export const convertRepeatHrPowerDuration = (
  duration: Duration,
  message: Record<string, unknown>
): boolean => {
  if (
    duration.type ===
    durationTypeSchema.enum.repeat_until_heart_rate_greater_than
  ) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilHrGreaterThan;
    message.repeatHr = encodeWorkoutHeartRate(duration.bpm);
    message.durationStep = duration.repeatFrom;
    return true;
  }

  if (
    duration.type === durationTypeSchema.enum.repeat_until_heart_rate_less_than
  ) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilHrLessThan;
    message.repeatHr = encodeWorkoutHeartRate(duration.bpm);
    message.durationStep = duration.repeatFrom;
    return true;
  }

  if (duration.type === durationTypeSchema.enum.repeat_until_power_less_than) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilPowerLessThan;
    message.repeatPower = encodeWorkoutPower(duration.watts);
    message.durationStep = duration.repeatFrom;
    return true;
  }

  if (
    duration.type === durationTypeSchema.enum.repeat_until_power_greater_than
  ) {
    message.durationType =
      fitDurationTypeSchema.enum.repeatUntilPowerGreaterThan;
    message.repeatPower = encodeWorkoutPower(duration.watts);
    message.durationStep = duration.repeatFrom;
    return true;
  }

  return false;
};
