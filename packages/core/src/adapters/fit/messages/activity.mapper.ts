import { fileTypeSchema } from "../../../domain/schemas/file-type";
import type { KRD } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { convertFitToKrdEvents } from "../event";
import { extractFitExtensions } from "../extensions/extensions.extractor";
import { convertFitToKrdLaps } from "../lap";
import { convertFitToKrdRecords } from "../record";
import { mapFitFileTypeToKrd } from "../metadata/file-type.mapper";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { convertFitToKrdSession } from "../session";
import type { FitMessages } from "../shared/types";

const KRD_VERSION = "1.0" as const;

/**
 * Converts FIT timeCreated to ISO string, handling Date objects and numbers
 */
const convertTimeCreated = (timeCreated: unknown): string => {
  if (timeCreated instanceof Date) return timeCreated.toISOString();
  if (typeof timeCreated === "number")
    return new Date(timeCreated * 1000).toISOString();
  return new Date().toISOString();
};

/**
 * Maps activity file to KRD format.
 */
export const mapActivityFileToKRD = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  const fileId = messages[fitMessageKeySchema.enum.fileIdMesgs]?.[0];
  const sessionMsgs = messages[fitMessageKeySchema.enum.sessionMesgs] || [];
  const recordMsgs = messages[fitMessageKeySchema.enum.recordMesgs] || [];
  const eventMsgs = messages[fitMessageKeySchema.enum.eventMesgs] || [];
  const lapMsgs = messages[fitMessageKeySchema.enum.lapMesgs] || [];

  logger.debug("Mapping activity file", {
    sessions: sessionMsgs.length,
    records: recordMsgs.length,
    events: eventMsgs.length,
    laps: lapMsgs.length,
  });

  const session =
    sessionMsgs.length > 0 ? convertFitToKrdSession(sessionMsgs[0]) : undefined;
  const records = convertFitToKrdRecords(recordMsgs);
  const events = convertFitToKrdEvents(eventMsgs);
  const laps = convertFitToKrdLaps(lapMsgs);
  const fitExtensions = extractFitExtensions(messages, logger);

  const created = convertTimeCreated(fileId?.timeCreated);
  const fileType = mapFitFileTypeToKrd(fileId?.type);

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.activity,
    metadata: {
      created,
      sport: session?.sport ?? "other",
      subSport: session?.subSport,
      fileType,
    },
    extensions: {
      fit: fitExtensions,
      activity: { session, records, events, laps },
    },
  };
};
