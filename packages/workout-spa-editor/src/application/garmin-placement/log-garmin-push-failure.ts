/**
 * A Garmin push that failed without a specific reason reports the generic
 * `library-push-failed`; its cause is logged here so the failure stays
 * diagnosable. Only the error's name and a scrubbed, bounded message are
 * logged: ids, tokens and emails never reach the console.
 */
import { scrubAnalyticsString } from "../../lib/scrub-analytics-string";
import { logger } from "../../utils/logger";

const MAX_MESSAGE = 200;

export const logGarminPushFailure = (error: unknown): void =>
  logger.error("[garmin-push] failed", {
    name: error instanceof Error ? error.name : typeof error,
    message: scrubAnalyticsString(
      error instanceof Error ? error.message : String(error),
      MAX_MESSAGE
    ),
  });
