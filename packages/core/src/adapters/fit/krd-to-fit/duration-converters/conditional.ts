import type { Duration } from "../../../../domain/schemas/duration";
import { durationTypeSchema } from "../../../../domain/schemas/duration";
import { fitDurationTypeSchema } from "../../schemas/fit-duration";

export const convertConditionalDuration = (
  duration: Duration,
  message: Record<string, unknown>
): boolean => {
  if (duration.type === durationTypeSchema.enum.heart_rate_less_than) {
    message.durationType = fitDurationTypeSchema.enum.hrLessThan;
    message.durationHr = duration.bpm;
    return true;
  }

  if (duration.type === durationTypeSchema.enum.power_less_than) {
    message.durationType = fitDurationTypeSchema.enum.powerLessThan;
    message.durationPower = duration.watts;
    return true;
  }

  if (duration.type === durationTypeSchema.enum.power_greater_than) {
    message.durationType = fitDurationTypeSchema.enum.powerGreaterThan;
    message.durationPower = duration.watts;
    return true;
  }

  return false;
};
