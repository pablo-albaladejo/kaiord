import { fileTypeSchema } from "@kaiord/core";
import type { KRD } from "@kaiord/core";
import type { Logger } from "@kaiord/core";
import { extractFitExtensions } from "../extensions/extensions.extractor";
import { mapMetadata } from "../metadata/metadata.mapper";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import type { FitMessages } from "../shared/types";
import { mapWorkout } from "../workout/workout.mapper";
import { validateMessages } from "./messages.validator";

const KRD_VERSION = "1.0" as const;

/**
 * Maps workout file to KRD format.
 */
export const mapWorkoutFileToKRD = (
  messages: FitMessages,
  logger: Logger
): KRD => {
  const fileId = messages[fitMessageKeySchema.enum.fileIdMesgs]?.[0];
  const workoutMsg = messages[fitMessageKeySchema.enum.workoutMesgs]?.[0];
  const workoutSteps =
    messages[fitMessageKeySchema.enum.workoutStepMesgs] || [];

  validateMessages(fileId, workoutMsg, messages, logger);

  const metadata = mapMetadata(fileId, workoutMsg, logger);
  const workout = mapWorkout(workoutMsg, workoutSteps, logger);
  const fitExtensions = extractFitExtensions(messages, logger);

  return {
    version: KRD_VERSION,
    type: fileTypeSchema.enum.structured_workout,
    metadata,
    extensions: { structured_workout: workout, fit: fitExtensions },
  };
};
