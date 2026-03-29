import { fileTypeSchema, type FileType } from "@kaiord/core";
import { createCourseMessages } from "../course";
import { createActivityMessages } from "./activity-messages.creator";
import { mapActivityFileToKRD } from "./activity.mapper";
import { mapWorkoutFileToKRD } from "./workout.mapper";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import type { FitMessages } from "../shared/types";
import type { Logger } from "@kaiord/core";
import type { KRD } from "@kaiord/core";

/**
 * Detects file type from FIT messages.
 */
const detectFileType = (messages: FitMessages): FileType => {
  const workoutMsgs = messages[fitMessageKeySchema.enum.workoutMesgs];
  if (workoutMsgs && workoutMsgs.length > 0)
    return fileTypeSchema.enum.structured_workout;

  const sessionMsgs = messages[fitMessageKeySchema.enum.sessionMesgs];
  const recordMsgs = messages[fitMessageKeySchema.enum.recordMesgs];
  if (
    (sessionMsgs && sessionMsgs.length > 0) ||
    (recordMsgs && recordMsgs.length > 0)
  ) {
    return fileTypeSchema.enum.recorded_activity;
  }

  return fileTypeSchema.enum.structured_workout;
};

export const mapMessagesToKRD = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  logger.debug("Mapping FIT messages to KRD", {
    messageCount: Object.keys(messages).length,
  });

  const fileType = detectFileType(messages);
  logger.debug("Detected file type", { fileType });

  switch (fileType) {
    case fileTypeSchema.enum.recorded_activity:
      return mapActivityFileToKRD(messages, logger);
    case fileTypeSchema.enum.structured_workout:
    default:
      return mapWorkoutFileToKRD(messages, logger);
  }
};

const groupWorkoutMessages = (
  rawMessages: unknown[]
): Record<string, unknown[]> => {
  const result: Record<string, unknown[]> = {};
  for (const msg of rawMessages) {
    const message = msg as { mesgNum?: number };
    const key =
      message.mesgNum === FIT_MESSAGE_NUMBERS.FILE_ID
        ? fitMessageKeySchema.enum.fileIdMesgs
        : message.mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT
          ? fitMessageKeySchema.enum.workoutMesgs
          : message.mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT_STEP
            ? fitMessageKeySchema.enum.workoutStepMesgs
            : null;
    if (key) {
      result[key] = [...(result[key] || []), message];
    }
  }
  return result;
};

/**
 * Creates FIT messages from KRD format with file type routing.
 *
 * Routes to the appropriate message creation function based on the
 * file type specified in KRD metadata. Supports workout, activity,
 * and course file types.
 */
export const createFitMessages = (
  krd: KRD,
  logger: Logger
): Record<string, unknown[]> => {
  const fileType = krd.type;
  logger.debug("Creating FIT messages from KRD", { fileType });

  switch (fileType) {
    case "structured_workout":
      return groupWorkoutMessages(convertKRDToMessages(krd, logger));
    case "recorded_activity":
      return createActivityMessages(krd, logger);
    case "course":
      return createCourseMessages(krd, logger);
    default:
      throw new Error(`Unsupported FIT file type: ${fileType}`);
  }
};
