import { durationTypeSchema } from "../../../domain/schemas/duration";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import { fitDurationTypeSchema } from "../schemas/fit-duration";

export const convertDuration = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  const { duration } = step;

  if (duration.type === durationTypeSchema.enum.time) {
    message.durationType = fitDurationTypeSchema.enum.time;
    message.durationTime = duration.seconds;
    return;
  }

  if (duration.type === durationTypeSchema.enum.distance) {
    message.durationType = fitDurationTypeSchema.enum.distance;
    message.durationDistance = duration.meters;
    return;
  }

  if (duration.type === durationTypeSchema.enum.heart_rate_less_than) {
    message.durationType = fitDurationTypeSchema.enum.hrLessThan;
    message.durationHr = duration.bpm;
    return;
  }

  if (
    duration.type ===
    durationTypeSchema.enum.repeat_until_heart_rate_greater_than
  ) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilHrGreaterThan;
    message.durationHr = duration.bpm;
    message.durationStep = duration.repeatFrom;
    return;
  }

  if (duration.type === durationTypeSchema.enum.calories) {
    message.durationType = fitDurationTypeSchema.enum.calories;
    message.durationCalories = duration.calories;
    return;
  }

  if (duration.type === durationTypeSchema.enum.power_less_than) {
    message.durationType = fitDurationTypeSchema.enum.powerLessThan;
    message.durationPower = duration.watts;
    return;
  }

  if (duration.type === durationTypeSchema.enum.power_greater_than) {
    message.durationType = fitDurationTypeSchema.enum.powerGreaterThan;
    message.durationPower = duration.watts;
    return;
  }

  if (duration.type === durationTypeSchema.enum.repeat_until_time) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilTime;
    message.durationTime = duration.seconds;
    message.durationStep = duration.repeatFrom;
    return;
  }

  if (duration.type === durationTypeSchema.enum.repeat_until_distance) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilDistance;
    message.durationDistance = duration.meters;
    message.durationStep = duration.repeatFrom;
    return;
  }

  if (duration.type === durationTypeSchema.enum.repeat_until_calories) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilCalories;
    message.durationCalories = duration.calories;
    message.durationStep = duration.repeatFrom;
    return;
  }

  if (
    duration.type === durationTypeSchema.enum.repeat_until_heart_rate_less_than
  ) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilHrLessThan;
    message.durationHr = duration.bpm;
    message.durationStep = duration.repeatFrom;
    return;
  }

  if (duration.type === durationTypeSchema.enum.repeat_until_power_less_than) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilPowerLessThan;
    message.durationPower = duration.watts;
    message.durationStep = duration.repeatFrom;
    return;
  }

  if (
    duration.type === durationTypeSchema.enum.repeat_until_power_greater_than
  ) {
    message.durationType =
      fitDurationTypeSchema.enum.repeatUntilPowerGreaterThan;
    message.durationPower = duration.watts;
    message.durationStep = duration.repeatFrom;
    return;
  }

  message.durationType = fitDurationTypeSchema.enum.open;
};
