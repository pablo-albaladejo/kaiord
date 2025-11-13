import type { RepetitionBlock, Workout } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { fitDurationTypeSchema } from "../schemas/fit-duration";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { fitTargetTypeSchema } from "../schemas/fit-target";
import { isRepetitionBlock } from "../shared/type-guards";
import { convertWorkoutStep } from "./krd-to-fit-step.mapper";

export const convertWorkoutSteps = (
  workout: Workout,
  logger: Logger
): Array<unknown> => {
  logger.debug("Converting workout steps", { stepCount: workout.steps.length });

  const messages: Array<unknown> = [];
  let messageIndex = 0;

  for (const step of workout.steps) {
    if (isRepetitionBlock(step)) {
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
    type: fitMessageKeySchema.enum.workoutStepMesgs,
    workoutStepMesg: {
      messageIndex,
      durationType: fitDurationTypeSchema.enum.repeatUntilStepsCmplt,
      durationStep: startIndex,
      repeatSteps: block.repeatCount,
      targetType: fitTargetTypeSchema.enum.open,
    },
  };
  messages.push(repeatMessage);

  return messages;
};
