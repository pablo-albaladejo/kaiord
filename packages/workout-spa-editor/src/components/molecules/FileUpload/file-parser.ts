/**
 * File Parsing Utilities
 */

import { KrdValidationError } from "@kaiord/core";
import type { KRD, ValidationError } from "../../../types/krd";
import { ValidationError as CustomValidationError } from "../../../types/errors";
import { getFormatName } from "../../../utils/file-format-metadata";
import { ImportError, importWorkout } from "../../../utils/import-workout";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
};

export type ImportProgressCallback = (progress: number) => void;

export const parseFile = async (
  file: File,
  onProgress?: ImportProgressCallback
): Promise<KRD> => {
  return await importWorkout(file, onProgress);
};

const convertToValidationErrors = (
  errors: Array<{ field: string; message: string }>
): Array<ValidationError> => {
  return errors.map((err) => ({
    path: err.field.split("."),
    message: err.message,
  }));
};

export const createParseError = (error: unknown): ErrorState => {
  if (error && typeof error === "object" && "title" in error) {
    return error as ErrorState;
  }

  if (error instanceof ImportError) {
    const formatName = error.format ? getFormatName(error.format) : "file";
    let validationErrors: Array<ValidationError> | undefined;
    if (error.cause instanceof CustomValidationError) {
      validationErrors = convertToValidationErrors(error.cause.errors);
    } else if (error.cause instanceof KrdValidationError) {
      validationErrors = convertToValidationErrors(error.cause.errors);
    }
    const message =
      error.message.startsWith("Failed to import") ||
      error.message.startsWith("Failed to parse")
        ? error.message
        : `Failed to import ${formatName} file: ${error.message}`;
    return {
      title: "Import Failed",
      message,
      validationErrors,
    };
  }

  if (error instanceof SyntaxError) {
    return {
      title: "Invalid File Format",
      message: `Failed to parse JSON: ${error.message}`,
    };
  }

  return {
    title: "File Read Error",
    message: `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
  };
};
