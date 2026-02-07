import type { Logger } from "@kaiord/core";

/**
 * Validates FIT activity file message structure
 *
 * Activity files must contain specific messages to be considered valid.
 * This validator ensures required messages are present.
 */
export const validateActivityMessages = (
  messages: Record<string, unknown[]>,
  logger?: Logger
): void => {
  const required = ["fileIdMesgs", "sessionMesgs"];

  for (const key of required) {
    if (!messages[key] || messages[key].length === 0) {
      throw new Error(`Activity file missing required ${key}`);
    }
  }

  // Warn if missing recommended messages
  if (!messages.recordMesgs || messages.recordMesgs.length === 0) {
    logger?.warn("Activity file has no record messages (GPS/sensor data)");
  }
};
