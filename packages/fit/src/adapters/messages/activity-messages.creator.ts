import type { KRD } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { convertMetadataToFileId } from "../krd-to-fit/krd-to-fit-metadata.mapper";

/**
 * Creates FIT activity messages from KRD format.
 *
 * Activity files contain recorded workout data with GPS and sensor information.
 * This function generates the appropriate message structure for activity files.
 */
export const createActivityMessages = (
  krd: KRD,
  logger: Logger
): Record<string, unknown[]> => {
  logger.debug("Creating activity messages from KRD");

  const messages: Record<string, unknown[]> = {
    fileIdMesgs: [convertMetadataToFileId(krd, logger)],
  };

  // Add session messages from top-level KRD fields
  if (krd.sessions && krd.sessions.length > 0) {
    messages.sessionMesgs = krd.sessions;
  }

  // Add record messages if present (GPS/sensor data)
  if (krd.records && krd.records.length > 0) {
    messages.recordMesgs = krd.records;
  }

  // Add lap messages if present
  if (krd.laps && krd.laps.length > 0) {
    messages.lapMesgs = krd.laps;
  }

  // Add event messages if present
  if (krd.events && krd.events.length > 0) {
    messages.eventMesgs = krd.events;
  }

  logger.debug("Created activity messages", {
    sessions: messages.sessionMesgs?.length ?? 0,
    records: messages.recordMesgs?.length ?? 0,
    laps: messages.lapMesgs?.length ?? 0,
    events: messages.eventMesgs?.length ?? 0,
  });

  return messages;
};
