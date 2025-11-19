import type { KRD } from "../../../domain/schemas/krd";
import type { Workout } from "../../../domain/schemas/workout";
import { createFitParsingError } from "../../../domain/types/errors";
import type { Logger } from "../../../ports/logger";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import {
  convertMetadataToFileId,
  convertWorkoutMetadata,
} from "./krd-to-fit-metadata.mapper";
import { convertWorkoutSteps } from "./krd-to-fit-workout.mapper";

export const convertKRDToMessages = (
  krd: KRD,
  logger: Logger
): Array<unknown> => {
  logger.debug("Converting KRD to FIT messages");

  const messages: Array<unknown> = [];

  const fileIdMessage = convertMetadataToFileId(krd, logger);
  messages.push(
    Object.assign({ mesgNum: FIT_MESSAGE_NUMBERS.FILE_ID }, fileIdMessage)
  );

  const workout = krd.extensions?.workout as Workout | undefined;
  if (!workout) {
    throw createFitParsingError("KRD missing workout data in extensions");
  }

  const workoutMessage = convertWorkoutMetadata(workout, logger);
  messages.push(
    Object.assign({ mesgNum: FIT_MESSAGE_NUMBERS.WORKOUT }, workoutMessage)
  );

  const workoutStepMessages = convertWorkoutSteps(workout, logger);
  for (const stepMessage of workoutStepMessages) {
    messages.push(
      Object.assign({ mesgNum: FIT_MESSAGE_NUMBERS.WORKOUT_STEP }, stepMessage)
    );
  }

  logger.debug("Converted KRD to FIT messages", {
    messageCount: messages.length,
  });

  return messages;
};
