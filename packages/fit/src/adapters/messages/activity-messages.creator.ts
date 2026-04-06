import type { KRD } from "@kaiord/core";
import type { Logger } from "@kaiord/core";

import { convertMetadataToFileId } from "../krd-to-fit/krd-to-fit-metadata.mapper";

const addActivityData = (
  messages: Record<string, unknown[]>,
  krd: KRD
): void => {
  if (krd.sessions && krd.sessions.length > 0) {
    messages.sessionMesgs = krd.sessions;
  }
  if (krd.records && krd.records.length > 0) {
    messages.recordMesgs = krd.records;
  }
  if (krd.laps && krd.laps.length > 0) {
    messages.lapMesgs = krd.laps;
  }
  if (krd.events && krd.events.length > 0) {
    messages.eventMesgs = krd.events;
  }
};

const logActivityMessages = (
  messages: Record<string, unknown[]>,
  logger: Logger
): void => {
  const sessions = messages.sessionMesgs ? messages.sessionMesgs.length : 0;
  const records = messages.recordMesgs ? messages.recordMesgs.length : 0;
  const laps = messages.lapMesgs ? messages.lapMesgs.length : 0;
  const events = messages.eventMesgs ? messages.eventMesgs.length : 0;
  logger.debug("Created activity messages", {
    sessions,
    records,
    laps,
    events,
  });
};

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

  addActivityData(messages, krd);
  logActivityMessages(messages, logger);

  return messages;
};
