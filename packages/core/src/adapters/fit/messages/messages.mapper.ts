import {
  fileTypeSchema,
  type FileType,
} from "../../../domain/schemas/file-type";
import type { KRD } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import type { FitMessages } from "../shared/types";
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
