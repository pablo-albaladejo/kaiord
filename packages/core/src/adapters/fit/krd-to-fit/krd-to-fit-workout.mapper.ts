import type { RepetitionBlock, Workout } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import {
  FIT_DURATION_TYPE,
  FIT_MESSAGE_KEY,
  FIT_TARGET_TYPE,
  TYPE_GUARD_PROPERTY,
} from "../constants";
import { convertWorkoutStep } from "./krd-to-fit-step.mapper";

export const convertWorkoutSteps = (
  workout: Workout,
  logger: Logger
): Array<unknown> => {
  logger.debug("Converting workout steps", { stepCount: workout.steps.length });

  const messages: Array<unknown> = [];
  let messageIndex = 0;

  for (const step of workout.steps) {
    if (TYPE_GUARD_PROPERTY.REPEAT_COUNT in step) {
      const repetitionMessages = convertRepetitionBlock(
        step,
        messageIndex,
        logger
      );
      messages.push(...repetitionMessages);
      messageIndex += repetitionMessages.length;
    } else {
      const stepMessage = convertWorkoutStep(step, messageIndex, logger);
      messages.push(stepMessage);
      messageIndex += 1;
    }
  }

  return messages;
};

const convertRepetitionBlock = (
  block: RepetitionBlock,
  startIndex: number,
  logger: Logger
): Array<unknown> => {
  logger.debug("Converting repetition block", {
    repeatCount: block.repeatCount,
    stepCount: block.steps.length,
  });

  const messages: Array<unknown> = [];
  let messageIndex = startIndex;

  for (const step of block.steps) {
    const stepMessage = convertWorkoutStep(step, messageIndex, logger);
    messages.push(stepMessage);
    messageIndex += 1;
  }

  const repeatMessage = {
    type: FIT_MESSAGE_KEY.WORKOUT_STEP,
    workoutStepMesg: {
      messageIndex,
      durationType: FIT_DURATION_TYPE.REPEAT_UNTIL_STEPS_COMPLETE,
      durationStep: startIndex,
      repeatSteps: block.repeatCount,
      targetType: FIT_TARGET_TYPE.OPEN,
    },
  };
  messages.push(repeatMessage);

  return messages;
};
