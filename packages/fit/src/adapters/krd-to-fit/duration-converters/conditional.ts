import type { Duration } from "@kaiord/core";
import { durationTypeSchema } from "@kaiord/core";

import { fitDurationTypeSchema } from "../../schemas/fit-duration";
import { encodeWorkoutHeartRate } from "../../target/heart-rate-helpers";
import { encodeWorkoutPower } from "../../target/power-helpers";

export const convertConditionalDuration = (
  duration: Duration,
  message: Record<string, unknown>
): boolean => {
  if (duration.type === durationTypeSchema.enum.heart_rate_less_than) {
    message.durationType = fitDurationTypeSchema.enum.hrLessThan;
    message.durationHr = encodeWorkoutHeartRate(duration.bpm);
    return true;
  }

  if (duration.type === durationTypeSchema.enum.power_less_than) {
    message.durationType = fitDurationTypeSchema.enum.powerLessThan;
    message.durationPower = encodeWorkoutPower(duration.watts);
    return true;
  }

  if (duration.type === durationTypeSchema.enum.power_greater_than) {
    message.durationType = fitDurationTypeSchema.enum.powerGreaterThan;
    message.durationPower = encodeWorkoutPower(duration.watts);
    return true;
  }

  return false;
};
