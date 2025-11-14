import type { Duration } from "../../../../domain/schemas/duration";
import { durationTypeSchema } from "../../../../domain/schemas/duration";
import { fitDurationTypeSchema } from "../../schemas/fit-duration";

export const convertRepeatDuration = (
  duration: Duration,
  message: Record<string, unknown>
): boolean => {
  if (duration.type === durationTypeSchema.enum.repeat_until_time) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilTime;
    message.durationTime = duration.seconds;
    message.durationStep = duration.repeatFrom;
    return true;
  }

  if (duration.type === durationTypeSchema.enum.repeat_until_distance) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilDistance;
    message.durationDistance = duration.meters;
    message.durationStep = duration.repeatFrom;
    return true;
  }

  if (duration.type === durationTypeSchema.enum.repeat_until_calories) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilCalories;
    message.durationCalories = duration.calories;
    message.durationStep = duration.repeatFrom;
    return true;
  }

  return false;
};
