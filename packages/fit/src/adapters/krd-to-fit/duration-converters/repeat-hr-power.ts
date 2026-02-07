import type { Duration } from "@kaiord/core";
import { durationTypeSchema } from "@kaiord/core";
import { fitDurationTypeSchema } from "../../schemas/fit-duration";

export const convertRepeatHrPowerDuration = (
  duration: Duration,
  message: Record<string, unknown>
): boolean => {
  if (
    duration.type ===
    durationTypeSchema.enum.repeat_until_heart_rate_greater_than
  ) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilHrGreaterThan;
    message.durationHr = duration.bpm;
    message.durationStep = duration.repeatFrom;
    return true;
  }

  if (
    duration.type === durationTypeSchema.enum.repeat_until_heart_rate_less_than
  ) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilHrLessThan;
    message.durationHr = duration.bpm;
    message.durationStep = duration.repeatFrom;
    return true;
  }

  if (duration.type === durationTypeSchema.enum.repeat_until_power_less_than) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilPowerLessThan;
    message.durationPower = duration.watts;
    message.durationStep = duration.repeatFrom;
    return true;
  }

  if (
    duration.type === durationTypeSchema.enum.repeat_until_power_greater_than
  ) {
    message.durationType =
      fitDurationTypeSchema.enum.repeatUntilPowerGreaterThan;
    message.durationPower = duration.watts;
    message.durationStep = duration.repeatFrom;
    return true;
  }

  return false;
};
