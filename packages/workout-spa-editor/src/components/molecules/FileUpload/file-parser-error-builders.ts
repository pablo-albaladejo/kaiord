/**
 * File Parser Error State Builders
 *
 * Functions for creating error states from different error types.
 */

import { KrdValidationError } from "@kaiord/core";
import { ValidationError as CustomValidationError } from "../../../types/errors";
import { getFormatName } from "../../../utils/file-format-metadata";
import type { ValidationError } from "../../../types/krd";
import type { ImportError } from "../../../utils/import-workout";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
};

const convertToValidationErrors = (
  errors: Array<{ field: string; message: string }>
): Array<ValidationError> => {
  return errors.map((err) => ({
    path: err.field.split("."),
    message: err.message,
  }));
};

const addPositionInfo = (
  message: string,
  parsingError: { line?: number; column?: number; message?: string }
): string => {
  let result = message;
  if (parsingError.line !== undefined && parsingError.column !== undefined) {
    result += ` (line ${parsingError.line}, column ${parsingError.column})`;
  } else if (parsingError.line !== undefined) {
    result += ` (line ${parsingError.line})`;
  }
  if (parsingError.message) {
    const positionRegex = /position (\d+)/i;
    const positionMatch = positionRegex.exec(parsingError.message);
    if (positionMatch && !result.includes("position")) {
      result += ` at position ${positionMatch[1]}`;
    }
  }
  return result;
};

export const createImportErrorState = (error: ImportError): ErrorState => {
  const formatName = error.format ? getFormatName(error.format) : "file";
  let validationErrors: Array<ValidationError> | undefined;

  if (
    error.cause instanceof CustomValidationError ||
    error.cause instanceof KrdValidationError
  ) {
    const cause = error.cause as CustomValidationError | KrdValidationError;
    validationErrors = convertToValidationErrors(cause.errors);
  }

  let message =
    error.message.startsWith("Failed to import") ||
    error.message.startsWith("Failed to parse")
      ? error.message
      : `Failed to import ${formatName} file: ${error.message}`;

  if (error.cause && typeof error.cause === "object" && "line" in error.cause) {
    const parsingError = error.cause as {
      line?: number;
      column?: number;
      message?: string;
    };
    message = addPositionInfo(message, parsingError);
  }

  const isUnrecoverable =
    error.message.includes("not a FIT file") ||
    error.message.includes("input is not a FIT file") ||
    error.message.includes("corrupted");

  if (isUnrecoverable) {
    message += ". Please check your file and try again.";
  }

  return {
    title: "Import Failed",
    message,
    validationErrors,
  };
};
