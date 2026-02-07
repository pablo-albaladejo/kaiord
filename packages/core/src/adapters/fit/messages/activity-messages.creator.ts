import type { KRD } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
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

  const activity = krd.extensions?.activity as
    | {
        session?: unknown;
        records?: unknown[];
        laps?: unknown[];
        events?: unknown[];
      }
    | undefined;

  // Add session messages if present in extensions
  if (activity?.session) {
    messages.sessionMesgs = [activity.session];
  }

  // Add record messages if present (GPS/sensor data)
  if (activity?.records) {
    messages.recordMesgs = activity.records;
  }

  // Add lap messages if present
  if (activity?.laps) {
    messages.lapMesgs = activity.laps;
  }

  // Add event messages if present
  if (activity?.events) {
    messages.eventMesgs = activity.events;
  }

  logger.debug("Created activity messages", {
    sessions: messages.sessionMesgs?.length ?? 0,
    records: messages.recordMesgs?.length ?? 0,
    laps: messages.lapMesgs?.length ?? 0,
    events: messages.eventMesgs?.length ?? 0,
  });

  return messages;
};
