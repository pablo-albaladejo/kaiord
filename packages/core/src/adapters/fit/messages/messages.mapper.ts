import {
  fileTypeSchema,
  type FileType,
} from "../../../domain/schemas/file-type";
import type { KRD } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { createCourseMessages } from "../course";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import type { FitMessages } from "../shared/types";
import {
  createActivityMessages,
  mapActivityFileToKRD,
} from "./activity.mapper";
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
    case fileTypeSchema.enum.workout:
      // Import convertKRDToMessages for workout files
      // Note: This returns Array<unknown> but we need Record<string, unknown[]>
      // For now, we'll handle workout files specially
      throw new Error(
        "Workout file type routing not yet implemented - use convertKRDToMessages directly"
      );
    case fileTypeSchema.enum.activity:
      return createActivityMessages(krd, logger);
    case fileTypeSchema.enum.course:
      return createCourseMessages(krd, logger);
    default:
      throw new Error(`Unsupported FIT file type: ${fileType}`);
  }
};
