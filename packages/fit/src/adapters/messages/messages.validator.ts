import { createFitParsingError } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import type { FitMessages } from "../shared/types";

export type ValidateMessagesOptions = {
  /** If true, throw on missing critical messages. Default: true */
  strict?: boolean;
};

/**
 * Validates required FIT messages are present.
 * In strict mode (default), throws on missing fileId or workout messages.
 */
export const validateMessages = (
  fileId: unknown,
  workoutMsg: unknown,
  messages: FitMessages,
  logger: Logger,
  options: ValidateMessagesOptions = {}
): void => {
  const { strict = true } = options;

  if (!fileId) {
    const message = "Missing required fileId message in FIT file";
    if (strict) {
      throw createFitParsingError(message);
    }
    logger.warn(message);
  }

  if (!workoutMsg) {
    const message = "Missing required workout message in FIT file";
    if (strict) {
      throw createFitParsingError(message);
    }
    logger.warn(message);
  }

  const workoutMessages = messages[fitMessageKeySchema.enum.workoutMesgs];
  if (workoutMessages && workoutMessages.length > 1) {
    logger.warn("Multiple workout messages found, using first one", {
      count: workoutMessages.length,
    });
  }
};
