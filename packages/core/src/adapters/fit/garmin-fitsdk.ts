/**
 * Garmin FIT SDK Adapter - converts FIT workout files to KRD format
 * References: https://developer.garmin.com/fit/file-types/workout/
 */

import { Decoder, Stream } from "@garmin/fitsdk";
import type { KRD } from "../../domain/schemas/krd";
import { createFitParsingError } from "../../domain/types/errors";
import type { FitReader } from "../../ports/fit-reader";
import type { Logger } from "../../ports/logger";
import { FIT_MESSAGE_KEY } from "./constants";
import { mapMetadata } from "./metadata.mapper";
import type { FitMessages } from "./types";
import { mapWorkout } from "./workout.mapper";

export const createGarminFitSdkReader = (logger: Logger): FitReader => ({
  readToKRD: async (buffer: Uint8Array): Promise<KRD> => {
    try {
      logger.debug("Parsing FIT file", { bufferSize: buffer.length });

      if (buffer.length === 0) {
        logger.error("Empty FIT buffer");
        throw createFitParsingError("Cannot parse empty FIT buffer");
      }

      const stream = Stream.fromByteArray(Array.from(buffer));
      const decoder = new Decoder(stream);
      const { messages, errors } = decoder.read();

      if (errors.length > 0) {
        logger.error("FIT parsing errors detected", { errors });
        throw createFitParsingError(`FIT parsing errors: ${errors.join(", ")}`);
      }

      logger.info("FIT file parsed successfully");
      return mapMessagesToKRD(messages as FitMessages, logger);
    } catch (error) {
      if (error instanceof Error && error.name === "FitParsingError") {
        throw error;
      }
      logger.error("Failed to parse FIT file", { error });
      throw createFitParsingError("Failed to parse FIT file", error);
    }
  },
});

const mapMessagesToKRD = (messages: FitMessages, logger: Logger): KRD => {
  logger.debug("Mapping FIT messages to KRD", {
    messageCount: Object.keys(messages).length,
  });

  const fileId = messages[FIT_MESSAGE_KEY.FILE_ID]?.[0];
  const workoutMsg = messages[FIT_MESSAGE_KEY.WORKOUT]?.[0];
  const workoutSteps = messages[FIT_MESSAGE_KEY.WORKOUT_STEP] || [];

  validateMessages(fileId, workoutMsg, messages, logger);

  const metadata = mapMetadata(fileId, workoutMsg, logger);
  const workout = mapWorkout(workoutMsg, workoutSteps, logger);

  return {
    version: "1.0",
    type: "workout",
    metadata,
    extensions: {
      workout,
    },
  };
};

const validateMessages = (
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
