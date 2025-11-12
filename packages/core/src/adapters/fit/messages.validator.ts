import type { Logger } from "../../ports/logger";
import { FIT_MESSAGE_KEY } from "./constants";
import type { FitMessages } from "./types";

export const validateMessages = (
  fileId: unknown,
  workoutMsg: unknown,
  messages: FitMessages,
  logger: Logger
): void => {
  if (!fileId) {
    logger.warn("No fileId message found in FIT file");
  }

  if (!workoutMsg) {
    logger.warn("No workout message found in FIT file");
  }

  const workoutMessages = messages[FIT_MESSAGE_KEY.WORKOUT];
  if (workoutMessages && workoutMessages.length > 1) {
    logger.warn("Multiple workout messages found, using first one", {
      count: workoutMessages.length,
    });
  }
};
