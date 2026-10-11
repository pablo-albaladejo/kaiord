import type { Logger } from "@kaiord/core";
import type { KRD } from "@kaiord/core";
import { fileTypeSchema } from "@kaiord/core";

import { convertFitToKrdEvents } from "../event/fit-to-krd-event.converter";
import { extractFitExtensions } from "../extensions/extensions.extractor";
import { convertFitTimeCreatedToIso } from "../health/shared/health-metadata.builder";
import { convertFitToKrdLaps } from "../lap";
import { convertFitToKrdRecords } from "../record/fit-to-krd-record.converter";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { convertFitToKrdSession } from "../session";
import type { FitMessages } from "../shared/types";

const KRD_VERSION = "1.0" as const;

const buildKrdMetadata = (
  fileId: Record<string, unknown> | undefined,
  session: ReturnType<typeof convertFitToKrdSession> | undefined
) => ({
  created: convertFitTimeCreatedToIso(fileId ? fileId.timeCreated : undefined),
  sport: (session ? session.sport : undefined) ?? "generic",
  subSport: session ? session.subSport : undefined,
});

const toOptionalArray = <T>(items: T[]): T[] | undefined =>
  items.length > 0 ? items : undefined;

/**
 * A RECORD without a timestamp cannot be placed on the activity timeline
 * (KRD records require one), so it is dropped instead of failing the import.
 */
const keepTimestampedRecords = (
  recordMsgs: Record<string, unknown>[],
  logger: Logger
): Record<string, unknown>[] => {
  const timestamped = recordMsgs.filter((r) => r.timestamp != null);
  const dropped = recordMsgs.length - timestamped.length;
  if (dropped > 0) {
    logger.warn("Dropping FIT records without timestamp", { dropped });
  }
  return timestamped;
};

const toOptionalSingle = <T>(item: T | undefined): T[] | undefined =>
  item !== undefined ? [item] : undefined;

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
    sessionMsgs.length > 0
      ? convertFitToKrdSession(sessionMsgs[0]!)
      : undefined;
  const records = convertFitToKrdRecords(
    keepTimestampedRecords(recordMsgs, logger)
  );
  const events = convertFitToKrdEvents(eventMsgs);
  const laps = convertFitToKrdLaps(lapMsgs);
  const fitExtensions = extractFitExtensions(messages, logger);

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.recorded_activity,
    metadata: buildKrdMetadata(
      fileId as Record<string, unknown> | undefined,
      session
    ),
    sessions: toOptionalSingle(session),
    laps: toOptionalArray(laps),
    records: toOptionalArray(records),
    events: toOptionalArray(events),
    extensions: { fit: fitExtensions },
  };
};
