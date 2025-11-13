import type { Logger } from "../../../ports/logger";
import { fitMessageKeyEnum } from "../schemas/fit-message-keys";
import type { FitMessages } from "../types";

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

  const workoutMessages = messages[fitMessageKeyEnum.enum.workoutMesgs];
  if (workoutMessages && workoutMessages.length > 1) {
    logger.warn("Multiple workout messages found, using first one", {
      count: workoutMessages.length,
    });
  }
};
