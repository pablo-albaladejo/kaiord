import { fileTypeSchema } from "../../../domain/schemas/file-type";
import type { KRD } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { convertFitToKrdEvents } from "../event";
import { extractFitExtensions } from "../extensions/extensions.extractor";
import { convertFitToKrdRecords } from "../record";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { convertFitToKrdSession } from "../session";
import type { FitMessages } from "../shared/types";

const KRD_VERSION = "1.0" as const;

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

  logger.debug("Mapping activity file", {
    sessions: sessionMsgs.length,
    records: recordMsgs.length,
    events: eventMsgs.length,
  });

  const session =
    sessionMsgs.length > 0 ? convertFitToKrdSession(sessionMsgs[0]) : undefined;
  const records = convertFitToKrdRecords(recordMsgs);
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
