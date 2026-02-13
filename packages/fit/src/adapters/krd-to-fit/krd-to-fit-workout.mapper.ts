import type { RepetitionBlock, Workout } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { fitDurationTypeSchema } from "../schemas/fit-duration";
import { fitTargetTypeSchema } from "../schemas/fit-target";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import { isRepetitionBlock } from "@kaiord/core";
import {
  convertWorkoutStep,
  type ConvertWorkoutStepOptions,
} from "./krd-to-fit-step.mapper";

export type ConvertWorkoutStepsOptions = ConvertWorkoutStepOptions;

export const convertWorkoutSteps = (
  workout: Workout,
  logger: Logger,
  options: ConvertWorkoutStepsOptions = {}
): Array<unknown> => {
  logger.debug("Converting workout steps", { stepCount: workout.steps.length });

  const messages: Array<unknown> = [];
  let messageIndex = 0;

  for (const step of workout.steps) {
    if (isRepetitionBlock(step)) {
      const repetitionMessages = convertRepetitionBlock(
        step,
        messageIndex,
        logger,
        options
      );
      messages.push(...repetitionMessages);
      messageIndex += repetitionMessages.length;
    } else {
      const stepMessage = convertWorkoutStep(
        step,
        messageIndex,
        logger,
        options
      );
      messages.push(stepMessage);
      messageIndex += 1;
    }
  }

  return messages;
};

const convertRepetitionBlock = (
  block: RepetitionBlock,
  startIndex: number,
  logger: Logger,
  options: ConvertWorkoutStepsOptions
): Array<unknown> => {
  logger.debug("Converting repetition block", {
    repeatCount: block.repeatCount,
    stepCount: block.steps.length,
  });

  const messages: Array<unknown> = [];
  let messageIndex = startIndex;

  for (const step of block.steps) {
    const stepMessage = convertWorkoutStep(step, messageIndex, logger, options);
    messages.push(stepMessage);
    messageIndex += 1;
  }

  const repeatMessage: Record<string, unknown> = {
    mesgNum: FIT_MESSAGE_NUMBERS.WORKOUT_STEP,
    messageIndex,
    durationType: fitDurationTypeSchema.enum.repeatUntilStepsCmplt,
    durationStep: startIndex,
    repeatSteps: block.repeatCount,
    targetType: fitTargetTypeSchema.enum.open,
  };
  messages.push(repeatMessage);

  return messages;
};
