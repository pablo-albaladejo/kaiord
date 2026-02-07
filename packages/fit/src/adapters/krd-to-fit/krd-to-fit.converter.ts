import type { KRD } from "@kaiord/core";
import { workoutSchema, type Workout } from "@kaiord/core";
import { createFitParsingError } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import {
  convertMetadataToFileId,
  convertWorkoutMetadata,
} from "./krd-to-fit-metadata.mapper";
import { convertWorkoutSteps } from "./krd-to-fit-workout.mapper";

/**
 * Safely converts unknown to Record<string, unknown>.
 * Returns empty object if value is not a valid object.
 */
const toRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
};

/**
 * Extracts and validates workout data from KRD extensions.
 * Throws if workout is missing or invalid.
 */
const extractWorkout = (krd: KRD, logger: Logger): Workout => {
  const rawWorkout = krd.extensions?.structured_workout;
  if (!rawWorkout) {
    throw createFitParsingError("KRD missing workout data in extensions");
  }

  const result = workoutSchema.safeParse(rawWorkout);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    logger.error("Invalid workout data in KRD extensions", { issues });
    throw createFitParsingError(`Invalid workout data: ${issues}`);
  }

  return result.data;
};

export const convertKRDToMessages = (
  krd: KRD,
  logger: Logger
): Array<unknown> => {
  logger.debug("Converting KRD to FIT messages");

  const messages: Array<unknown> = [];

  const fileIdMessage = convertMetadataToFileId(krd, logger);
  messages.push({
    mesgNum: FIT_MESSAGE_NUMBERS.FILE_ID,
    ...fileIdMessage,
  });

  const workout = extractWorkout(krd, logger);

  const workoutMessage = convertWorkoutMetadata(workout, logger);
  messages.push({
    mesgNum: FIT_MESSAGE_NUMBERS.WORKOUT,
    ...workoutMessage,
  });

  const workoutStepMessages = convertWorkoutSteps(workout, logger);
  for (const stepMessage of workoutStepMessages) {
    messages.push({
      mesgNum: FIT_MESSAGE_NUMBERS.WORKOUT_STEP,
      ...toRecord(stepMessage),
    });
  }

  logger.debug("Converted KRD to FIT messages", {
    messageCount: messages.length,
  });

  return messages;
};
