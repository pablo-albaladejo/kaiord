import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { FIT_DURATION_TYPE, FIT_MESSAGE_KEY } from "../constants";
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
    type: FIT_MESSAGE_KEY.WORKOUT_STEP,
    workoutStepMesg,
  };
};

const convertDuration = (
  step: WorkoutStep,
  message: Record<string, unknown>
): void => {
  if (step.duration.type === "time") {
    message.durationType = FIT_DURATION_TYPE.TIME;
    message.durationTime = step.duration.seconds;
  } else if (step.duration.type === "distance") {
    message.durationType = FIT_DURATION_TYPE.DISTANCE;
    message.durationDistance = step.duration.meters;
  } else if (step.duration.type === "heart_rate_less_than") {
    message.durationType = FIT_DURATION_TYPE.HR_LESS_THAN;
    message.durationHr = step.duration.bpm;
  } else if (step.duration.type === "heart_rate_greater_than") {
    message.durationType = FIT_DURATION_TYPE.REPEAT_UNTIL_HR_GREATER_THAN;
    message.durationHr = step.duration.bpm;
    message.durationStep = step.duration.repeatFrom;
  } else {
    message.durationType = FIT_DURATION_TYPE.OPEN;
  }
};
