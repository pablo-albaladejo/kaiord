import { fileTypeSchema } from "@kaiord/core";
import { convertFitToKrdEvents } from "../event";
import { extractFitExtensions } from "../extensions/extensions.extractor";
import { convertFitToKrdLaps } from "../lap";
import { convertFitToKrdRecords } from "../record";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { convertFitToKrdSession } from "../session";
import type { FitMessages } from "../shared/types";
import type { Logger } from "@kaiord/core";
import type { KRD } from "@kaiord/core";

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

const buildKrdMetadata = (
  fileId: Record<string, unknown> | undefined,
  session: ReturnType<typeof convertFitToKrdSession> | undefined
) => ({
  created: convertTimeCreated(fileId ? fileId.timeCreated : undefined),
  sport: (session ? session.sport : undefined) ?? "other",
  subSport: session ? session.subSport : undefined,
});

const toOptionalArray = <T>(items: T[]): T[] | undefined =>
  items.length > 0 ? items : undefined;

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
    sessionMsgs.length > 0 ? convertFitToKrdSession(sessionMsgs[0]) : undefined;
  const records = convertFitToKrdRecords(recordMsgs);
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
