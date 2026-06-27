import type { RepetitionBlock, Workout } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { isRepetitionBlock } from "@kaiord/core";

import { fitDurationTypeSchema } from "../schemas/fit-duration";
import { fitTargetTypeSchema } from "../schemas/fit-target";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import {
  convertNotes,
  convertWorkoutStep,
  type ConvertWorkoutStepOptions,
} from "./krd-to-fit-step.converter";

export type ConvertWorkoutStepsOptions = ConvertWorkoutStepOptions;

// FIT has no workout-level notes — only per-step notes (max 256). Workout-level
// `notes` (e.g. a coach description) are attached best-effort to the FIRST step
// when that step has no note of its own, truncated via the shared step-note
// rule. A step's own note is more specific and is never overwritten.
const attachWorkoutNotesToFirstStep = (
  messages: Array<Record<string, unknown>>,
  workout: Workout,
  notesTruncation: "truncate" | "error",
  logger: Logger
): void => {
  if (!workout.notes) return;
  const first = messages[0];
  if (!first || first.notes !== undefined) return;
  first.notes = convertNotes(workout.notes, 0, notesTruncation, logger);
};

export const convertWorkoutSteps = (
  workout: Workout,
  logger: Logger,
  options: ConvertWorkoutStepsOptions = {}
): Array<unknown> => {
  logger.debug("Converting workout steps", { stepCount: workout.steps.length });

  const messages: Array<Record<string, unknown>> = [];
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

  attachWorkoutNotesToFirstStep(
    messages,
    workout,
    options.notesTruncation ?? "truncate",
    logger
  );

  return messages;
};

const convertRepetitionBlock = (
  block: RepetitionBlock,
  startIndex: number,
  logger: Logger,
  options: ConvertWorkoutStepsOptions
): Array<Record<string, unknown>> => {
  logger.debug("Converting repetition block", {
    repeatCount: block.repeatCount,
    stepCount: block.steps.length,
  });

  const messages: Array<Record<string, unknown>> = [];
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
