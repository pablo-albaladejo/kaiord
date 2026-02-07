import {
  fileTypeSchema,
  type FileType,
} from "../../../domain/schemas/file-type";
import type { KRD } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { createCourseMessages } from "../course";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import type { FitMessages } from "../shared/types";
import { createActivityMessages } from "./activity-messages.creator";
import { mapActivityFileToKRD } from "./activity.mapper";
import { mapWorkoutFileToKRD } from "./workout.mapper";

/**
 * Detects file type from FIT messages.
 */
const detectFileType = (messages: FitMessages): FileType => {
  const workoutMsgs = messages[fitMessageKeySchema.enum.workoutMesgs];
  if (workoutMsgs && workoutMsgs.length > 0) return fileTypeSchema.enum.workout;

  const sessionMsgs = messages[fitMessageKeySchema.enum.sessionMesgs];
  const recordMsgs = messages[fitMessageKeySchema.enum.recordMesgs];
  if (
    (sessionMsgs && sessionMsgs.length > 0) ||
    (recordMsgs && recordMsgs.length > 0)
  ) {
    return fileTypeSchema.enum.activity;
  }

  return fileTypeSchema.enum.workout;
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
    case fileTypeSchema.enum.activity:
      return mapActivityFileToKRD(messages, logger);
    case fileTypeSchema.enum.workout:
    default:
      return mapWorkoutFileToKRD(messages, logger);
  }
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
  const fileType = krd.metadata?.fileType ?? fileTypeSchema.enum.workout;
  logger.debug("Creating FIT messages from KRD", { fileType });

  switch (fileType) {
    case fileTypeSchema.enum.workout: {
      // Workout files use array-based format from convertKRDToMessages
      // Group messages by type for compatibility with record-based format
      const messages = convertKRDToMessages(krd, logger);
      const result: Record<string, unknown[]> = {};

      for (const msg of messages) {
        const message = msg as { mesgNum?: number };
        if (message.mesgNum === FIT_MESSAGE_NUMBERS.FILE_ID) {
          result[fitMessageKeySchema.enum.fileIdMesgs] = [
            ...(result[fitMessageKeySchema.enum.fileIdMesgs] || []),
            message,
          ];
        } else if (message.mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT) {
          result[fitMessageKeySchema.enum.workoutMesgs] = [
            ...(result[fitMessageKeySchema.enum.workoutMesgs] || []),
            message,
          ];
        } else if (message.mesgNum === FIT_MESSAGE_NUMBERS.WORKOUT_STEP) {
          result[fitMessageKeySchema.enum.workoutStepMesgs] = [
            ...(result[fitMessageKeySchema.enum.workoutStepMesgs] || []),
            message,
          ];
        }
      }

      return result;
    }
    case fileTypeSchema.enum.activity:
      return createActivityMessages(krd, logger);
    case fileTypeSchema.enum.course:
      return createCourseMessages(krd, logger);
    default:
      throw new Error(`Unsupported FIT file type: ${fileType}`);
  }
};
