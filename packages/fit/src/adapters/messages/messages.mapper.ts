import type { Logger } from "@kaiord/core";
import type { KRD } from "@kaiord/core";
import { type FileType, fileTypeSchema } from "@kaiord/core";

import { createCourseMessages } from "../course";
import { convertFitToKrdHealthSleep } from "../health/sleep/fit-to-krd-health-sleep.converter";
import { convertKrdToFitHealthSleepMessages } from "../health/sleep/krd-health-sleep-to-fit.converter";
import { groupSleepMessages } from "../health/sleep/sleep-message-grouping";
import { convertKRDToMessages } from "../krd-to-fit/krd-to-fit.converter";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";
import type { FitMessages } from "../shared/types";
import { mapActivityFileToKRD } from "./activity.mapper";
import { createActivityMessages } from "./activity-messages.creator";
import { mapWorkoutFileToKRD } from "./workout.mapper";

const HEALTH_DETECTORS: ReadonlyArray<readonly [string, FileType]> = [
  ["sleepLevelMesgs", fileTypeSchema.enum.sleep_record],
];

const detectFileType = (messages: FitMessages): FileType => {
  for (const [key, type] of HEALTH_DETECTORS) {
    const mesgs = messages[key];
    if (mesgs && mesgs.length > 0) return type;
  }

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
    case fileTypeSchema.enum.sleep_record:
      return convertFitToKrdHealthSleep(messages, logger);
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
 * Creates FIT messages from KRD format with file-type routing.
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
    case "sleep_record":
      return groupSleepMessages(
        convertKrdToFitHealthSleepMessages(krd, logger)
      );
    default:
      throw new Error(`Unsupported FIT file type: ${fileType}`);
  }
};
