import type { KRD } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { FIT_MESSAGE_KEY, KRD_FILE_TYPE, KRD_VERSION } from "../constants";
import { extractFitExtensions } from "../extensions/extensions.extractor";
import { validateMessages } from "./messages.validator";
import { mapMetadata } from "../metadata/metadata.mapper";
import type { FitMessages } from "../types";
import { mapWorkout } from "../workout/workout.mapper";

export const mapMessagesToKRD = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  logger.debug("Mapping FIT messages to KRD", {
    messageCount: Object.keys(messages).length,
  });

  const fileId = messages[FIT_MESSAGE_KEY.FILE_ID]?.[0];
  const workoutMsg = messages[FIT_MESSAGE_KEY.WORKOUT]?.[0];
  const workoutSteps = messages[FIT_MESSAGE_KEY.WORKOUT_STEP] || [];

  validateMessages(fileId, workoutMsg, messages, logger);

  const metadata = mapMetadata(fileId, workoutMsg, logger);
  const workout = mapWorkout(workoutMsg, workoutSteps, logger);
  const fitExtensions = extractFitExtensions(messages, logger);

  return {
    version: KRD_VERSION,
    type: KRD_FILE_TYPE.WORKOUT,
    metadata,
    extensions: {
      workout,
      fit: fitExtensions,
    },
  };
};
