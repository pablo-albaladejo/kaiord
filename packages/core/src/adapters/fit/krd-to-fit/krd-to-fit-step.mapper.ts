import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { fitDurationTypeEnum } from "../schemas/fit-duration";
import { fitMessageKeyEnum } from "../schemas/fit-message-keys";
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

  convertDuration(step, workoutStepMesg);
  convertTarget(step, workoutStepMesg);

  return {
    type: fitMessageKeyEnum.enum.workoutStepMesgs,
    workoutStepMesg,
  };
};

const convertDuration = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  if (step.duration.type === "time") {
    message.durationType = fitDurationTypeEnum.enum.time;
    message.durationTime = step.duration.seconds;
  } else if (step.duration.type === "distance") {
    message.durationType = fitDurationTypeEnum.enum.distance;
    message.durationDistance = step.duration.meters;
  } else if (step.duration.type === "heart_rate_less_than") {
    message.durationType = fitDurationTypeEnum.enum.hrLessThan;
    message.durationHr = step.duration.bpm;
  } else if (step.duration.type === "heart_rate_greater_than") {
    message.durationType = fitDurationTypeEnum.enum.repeatUntilHrGreaterThan;
    message.durationHr = step.duration.bpm;
    message.durationStep = step.duration.repeatFrom;
  } else {
    message.durationType = fitDurationTypeEnum.enum.open;
  }
};
