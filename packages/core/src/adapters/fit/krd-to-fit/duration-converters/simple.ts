import type { Duration } from "../../../../domain/schemas/duration";
import { durationTypeSchema } from "../../../../domain/schemas/duration";
import { fitDurationTypeSchema } from "../../schemas/fit-duration";

export const convertSimpleDuration = (
  duration: Duration,
  message: Record<string, unknown>
): boolean => {
  if (duration.type === durationTypeSchema.enum.time) {
    message.durationType = fitDurationTypeSchema.enum.time;
    message.durationTime = duration.seconds;
    return true;
  }

  if (duration.type === durationTypeSchema.enum.distance) {
    message.durationType = fitDurationTypeSchema.enum.distance;
    message.durationDistance = duration.meters;
    return true;
  }

  if (duration.type === durationTypeSchema.enum.calories) {
    message.durationType = fitDurationTypeSchema.enum.calories;
    message.durationCalories = duration.calories;
    return true;
  }

  return false;
};
