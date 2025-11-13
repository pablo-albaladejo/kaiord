import { durationTypeSchema } from "../../../domain/schemas/duration";
import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { mapEquipmentToFit } from "../equipment.mapper";
import { fitDurationTypeSchema } from "../schemas/fit-duration";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { convertDuration } from "./krd-to-fit-duration.mapper";
import { convertTarget } from "./krd-to-fit-target.mapper";

export const convertWorkoutStep = (
  step: WorkoutStep,
  messageIndex: number,
  logger: Logger
): unknown => {
  logger.debug("Converting workout step", { stepIndex: step.stepIndex });

  const workoutStepMesg: Record<string, unknown> = {
    messageIndex,
  };

  if (step.name) {
    workoutStepMesg.wktStepName = step.name;
  }

  if (step.intensity) {
    workoutStepMesg.intensity = step.intensity;
  }

  if (step.notes !== undefined) {
    if (step.notes.length > 256) {
      logger.warn("Notes exceed 256 characters, truncating", {
        originalLength: step.notes.length,
      });
      workoutStepMesg.notes = step.notes.substring(0, 256);
    } else {
      workoutStepMesg.notes = step.notes;
    }
  }

  if (step.equipment !== undefined) {
    workoutStepMesg.equipment = mapEquipmentToFit(step.equipment);
  }

  convertDuration(step, workoutStepMesg);
  convertTarget(step, workoutStepMesg);

  return {
    type: fitMessageKeySchema.enum.workoutStepMesgs,
    workoutStepMesg,
  };
};

const convertDuration = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  if (step.duration.type === durationTypeSchema.enum.time) {
    message.durationType = fitDurationTypeSchema.enum.time;
    message.durationTime = step.duration.seconds;
  } else if (step.duration.type === durationTypeSchema.enum.distance) {
    message.durationType = fitDurationTypeSchema.enum.distance;
    message.durationDistance = step.duration.meters;
  } else if (
    step.duration.type === durationTypeSchema.enum.heart_rate_less_than
  ) {
    message.durationType = fitDurationTypeSchema.enum.hrLessThan;
    message.durationHr = step.duration.bpm;
  } else if (
    step.duration.type ===
    durationTypeSchema.enum.repeat_until_heart_rate_greater_than
  ) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilHrGreaterThan;
    message.durationHr = step.duration.bpm;
    message.durationStep = step.duration.repeatFrom;
  } else if (step.duration.type === durationTypeSchema.enum.calories) {
    message.durationType = fitDurationTypeSchema.enum.calories;
    message.durationCalories = step.duration.calories;
  } else if (step.duration.type === durationTypeSchema.enum.power_less_than) {
    message.durationType = fitDurationTypeSchema.enum.powerLessThan;
    message.durationPower = step.duration.watts;
  } else if (
    step.duration.type === durationTypeSchema.enum.power_greater_than
  ) {
    message.durationType = fitDurationTypeSchema.enum.powerGreaterThan;
    message.durationPower = step.duration.watts;
  } else if (step.duration.type === durationTypeSchema.enum.repeat_until_time) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilTime;
    message.durationTime = step.duration.seconds;
    message.durationStep = step.duration.repeatFrom;
  } else if (
    step.duration.type === durationTypeSchema.enum.repeat_until_distance
  ) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilDistance;
    message.durationDistance = step.duration.meters;
    message.durationStep = step.duration.repeatFrom;
  } else if (
    step.duration.type === durationTypeSchema.enum.repeat_until_calories
  ) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilCalories;
    message.durationCalories = step.duration.calories;
    message.durationStep = step.duration.repeatFrom;
  } else if (
    step.duration.type ===
    durationTypeSchema.enum.repeat_until_heart_rate_less_than
  ) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilHrLessThan;
    message.durationHr = step.duration.bpm;
    message.durationStep = step.duration.repeatFrom;
  } else if (
    step.duration.type === durationTypeSchema.enum.repeat_until_power_less_than
  ) {
    message.durationType = fitDurationTypeSchema.enum.repeatUntilPowerLessThan;
    message.durationPower = step.duration.watts;
    message.durationStep = step.duration.repeatFrom;
  } else if (
    step.duration.type ===
    durationTypeSchema.enum.repeat_until_power_greater_than
  ) {
    message.durationType =
      fitDurationTypeSchema.enum.repeatUntilPowerGreaterThan;
    message.durationPower = step.duration.watts;
    message.durationStep = step.duration.repeatFrom;
  } else {
    message.durationType = fitDurationTypeSchema.enum.open;
  }
};
