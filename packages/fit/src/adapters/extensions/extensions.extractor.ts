import type { Logger } from "@kaiord/core";
import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import type { FitMessages } from "../shared/types";

export const extractFitExtensions = (
  messages: FitMessages,
  logger: Logger
): Record<string, unknown> => {
  logger.debug("Extracting FIT extensions");

  const unknownMessages = extractUnknownMessages(messages, logger);
  const developerFields = extractAllDeveloperFields(messages);

  return buildExtensions(unknownMessages, developerFields, logger);
};

const extractUnknownMessages = (
  messages: FitMessages,
  logger: Logger
): Record<string, Array<Record<string, unknown>>> => {
  const knownMessageKeys = new Set<string>([
    fitMessageKeySchema.enum.fileIdMesgs,
    fitMessageKeySchema.enum.workoutMesgs,
    fitMessageKeySchema.enum.workoutStepMesgs,
  ]);

  const unknownMessages: Record<string, Array<Record<string, unknown>>> = {};

  for (const [key, value] of Object.entries(messages)) {
    if (!knownMessageKeys.has(key) && value && Array.isArray(value)) {
      logger.debug("Found unknown message type", { messageType: key });
      unknownMessages[key] = value;
    }
  }

  return unknownMessages;
};

const extractAllDeveloperFields = (
  messages: FitMessages
): Array<Record<string, unknown>> => {
  const developerFields: Array<Record<string, unknown>> = [];

  for (const value of Object.values(messages)) {
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

  return developerFields;
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

const buildExtensions = (
  unknownMessages: Record<string, Array<Record<string, unknown>>>,
  developerFields: Array<Record<string, unknown>>,
  logger: Logger
): Record<string, unknown> => {
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
