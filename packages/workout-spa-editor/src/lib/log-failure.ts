import { errorMessage } from "../utils/error-message";
import { logger } from "../utils/logger";
import { scrubAnalyticsString } from "./scrub-analytics-string";

const MAX_MESSAGE = 200;

/**
 * Keeps a failure's own text for diagnosis, in the console only: the
 * athlete reads the dictionary's wording, never this. Only the error's name
 * and a scrubbed, bounded message are logged, so ids, tokens and emails
 * never reach the console.
 */
export const logFailure = (where: string, error: unknown): void =>
  logger.error("[failure]", {
    where,
    name: error instanceof Error ? error.name : typeof error,
    message: scrubAnalyticsString(errorMessage(error), MAX_MESSAGE),
  });
