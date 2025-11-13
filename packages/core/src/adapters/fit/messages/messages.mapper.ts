import { fileTypeSchema } from "../../../domain/schemas/file-type";
import type { KRD } from "../../../domain/schemas/krd";
import type { Logger } from "../../../ports/logger";
import { extractFitExtensions } from "../extensions/extensions.extractor";
import { mapMetadata } from "../metadata/metadata.mapper";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import type { FitMessages } from "../types";
import { mapWorkout } from "../workout/workout.mapper";
import { validateMessages } from "./messages.validator";

const KRD_VERSION = "1.0" as const;

export const mapMessagesToKRD = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  logger.debug("Mapping FIT messages to KRD", {
    messageCount: Object.keys(messages).length,
  });

  const fileId = messages[fitMessageKeySchema.enum.fileIdMesgs]?.[0];
  const workoutMsg = messages[fitMessageKeySchema.enum.workoutMesgs]?.[0];
  const workoutSteps = messages[fitMessageKeySchema.enum.workoutStepMesgs] || [];

  validateMessages(fileId, workoutMsg, messages, logger);

  const metadata = mapMetadata(fileId, workoutMsg, logger);
  const workout = mapWorkout(workoutMsg, workoutSteps, logger);
  const fitExtensions = extractFitExtensions(messages, logger);

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.workout,
    metadata,
    extensions: {
      workout,
      fit: fitExtensions,
    },
  };
};
