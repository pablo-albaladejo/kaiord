/**
 * Garmin FIT SDK Adapter - converts FIT workout files to KRD format
 * References: https://developer.garmin.com/fit/file-types/workout/
 */

import { Decoder, Encoder, Stream } from "@garmin/fitsdk";
import type { KRD } from "../../domain/schemas/krd";
import { createFitParsingError } from "../../domain/types/errors";
import type { FitReader } from "../../ports/fit-reader";
import type { FitWriter } from "../../ports/fit-writer";
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
  const fitExtensions = extractFitExtensions(messages, logger);

  return {
    version: "1.0",
    type: "workout",
    metadata,
    extensions: {
      workout,
      fit: fitExtensions,
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

const extractFitExtensions = (
  messages: FitMessages,
  logger: Logger
): Record<string, unknown> => {
  logger.debug("Extracting FIT extensions");

  const knownMessageKeys = new Set<string>([
    FIT_MESSAGE_KEY.FILE_ID,
    FIT_MESSAGE_KEY.WORKOUT,
    FIT_MESSAGE_KEY.WORKOUT_STEP,
  ]);

  const unknownMessages: Record<string, Array<Record<string, unknown>>> = {};
  const developerFields: Array<Record<string, unknown>> = [];

  for (const [key, value] of Object.entries(messages)) {
    if (!knownMessageKeys.has(key) && value && Array.isArray(value)) {
      logger.debug("Found unknown message type", { messageType: key });
      unknownMessages[key] = value;
    }

    if (value && Array.isArray(value)) {
      for (const message of value) {
        if (message && typeof message === "object") {
          const devFields = extractDeveloperFields(message);
          if (devFields.length > 0) {
            developerFields.push(...devFields);
          }
        }
      }
    }
  }

  const extensions: Record<string, unknown> = {};

  if (developerFields.length > 0) {
    logger.info("Preserved developer fields", {
      count: developerFields.length,
    });
    extensions.developerFields = developerFields;
  }

  if (Object.keys(unknownMessages).length > 0) {
    logger.info("Preserved unknown message types", {
      types: Object.keys(unknownMessages),
    });
    extensions.unknownMessages = unknownMessages;
  }

  return extensions;
};

const extractDeveloperFields = (
  message: Record<string, unknown>
): Array<Record<string, unknown>> => {
  const devFields: Array<Record<string, unknown>> = [];

  for (const [key, value] of Object.entries(message)) {
    if (key.startsWith("developer_") || key.includes("DeveloperField")) {
      devFields.push({
        fieldName: key,
        value,
      });
    }
  }

  return devFields;
};

export const createGarminFitSdkWriter = (logger: Logger): FitWriter => ({
  writeFromKRD: async (krd: KRD): Promise<Uint8Array> => {
    try {
      logger.debug("Encoding KRD to FIT");

      const encoder = new Encoder();
      const messages = convertKRDToMessages(krd, logger);

      for (const message of messages) {
        encoder.write(message);
      }

      const buffer = encoder.finish();
      logger.info("KRD encoded to FIT successfully");
      return new Uint8Array(buffer);
    } catch (error) {
      if (error instanceof Error && error.name === "FitParsingError") {
        throw error;
      }
      logger.error("Failed to write FIT file", { error });
      throw createFitParsingError("Failed to write FIT file", error);
    }
  },
});

const convertKRDToMessages = (krd: KRD, logger: Logger): Array<unknown> => {
  logger.debug("Converting KRD to FIT messages");
  throw createFitParsingError("KRD to FIT conversion not yet implemented");
};
