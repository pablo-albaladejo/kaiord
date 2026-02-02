import {
  fileTypeSchema,
  type FileType,
} from "../../../domain/schemas/file-type";
import type { KRD } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { convertFitToKrdEvents } from "../event";
import { extractFitExtensions } from "../extensions/extensions.extractor";
import { mapMetadata } from "../metadata/metadata.mapper";
import { convertFitToKrdRecords } from "../record";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { convertFitToKrdSession } from "../session";
import type { FitMessages } from "../shared/types";
import { mapWorkout } from "../workout/workout.mapper";
import { validateMessages } from "./messages.validator";

const KRD_VERSION = "1.0" as const;

/**
 * Detects file type from FIT messages.
 */
const detectFileType = (messages: FitMessages): FileType => {
  // Check for workout-specific messages
  const workoutMsgs = messages[fitMessageKeySchema.enum.workoutMesgs];
  if (workoutMsgs && workoutMsgs.length > 0) return fileTypeSchema.enum.workout;

  // Check for activity-specific messages (SESSION, RECORD)
  const sessionMsgs = messages[fitMessageKeySchema.enum.sessionMesgs];
  const recordMsgs = messages[fitMessageKeySchema.enum.recordMesgs];
  if (
    (sessionMsgs && sessionMsgs.length > 0) ||
    (recordMsgs && recordMsgs.length > 0)
  ) {
    return fileTypeSchema.enum.activity;
  }

  // Default to workout for backward compatibility
  return fileTypeSchema.enum.workout;
};

/**
 * Maps workout file to KRD format.
 */
const mapWorkoutFileToKRD = (messages: FitMessages, logger: Logger): KRD => {
  const fileId = messages[fitMessageKeySchema.enum.fileIdMesgs]?.[0];
  const workoutMsg = messages[fitMessageKeySchema.enum.workoutMesgs]?.[0];
  const workoutSteps =
    messages[fitMessageKeySchema.enum.workoutStepMesgs] || [];

  validateMessages(fileId, workoutMsg, messages, logger);

  const metadata = mapMetadata(fileId, workoutMsg, logger);
  const workout = mapWorkout(workoutMsg, workoutSteps, logger);
  const fitExtensions = extractFitExtensions(messages, logger);

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.workout,
    metadata,
    extensions: { workout, fit: fitExtensions },
  };
};

/**
 * Maps activity file to KRD format.
 */
const mapActivityFileToKRD = (messages: FitMessages, logger: Logger): KRD => {
  const fileId = messages[fitMessageKeySchema.enum.fileIdMesgs]?.[0];
  const sessionMsgs = messages[fitMessageKeySchema.enum.sessionMesgs] || [];
  const recordMsgs = messages[fitMessageKeySchema.enum.recordMesgs] || [];
  const eventMsgs = messages[fitMessageKeySchema.enum.eventMesgs] || [];

  logger.debug("Mapping activity file", {
    sessions: sessionMsgs.length,
    records: recordMsgs.length,
    events: eventMsgs.length,
  });

  // Convert session (use first session for now)
  const session =
    sessionMsgs.length > 0 ? convertFitToKrdSession(sessionMsgs[0]) : undefined;

  // Convert records
  const records = convertFitToKrdRecords(recordMsgs);

  // Convert events
  const events = convertFitToKrdEvents(eventMsgs);

  const fitExtensions = extractFitExtensions(messages, logger);

  const timeCreated = fileId?.timeCreated as number | undefined;
  const created = timeCreated
    ? new Date(timeCreated * 1000).toISOString()
    : new Date().toISOString();

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.activity,
    metadata: {
      created,
      sport: session?.sport ?? "other",
      subSport: session?.subSport,
    },
    extensions: {
      fit: fitExtensions,
      activity: { session, records, events },
    },
  };
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
