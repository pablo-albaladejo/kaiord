/**
 * Import error transformation utilities
 */

import {
  FitParsingError,
  KrdValidationError,
  TcxParsingError,
  ZwiftParsingError,
} from "@kaiord/core";
import type { WorkoutFileFormat } from "./file-format-detector";
import { ImportError } from "./import-workout";

export const transformError = (
  error: unknown,
  format: WorkoutFileFormat
): ImportError => {
  if (error instanceof ImportError) {
    return error;
  }

  if (error instanceof FitParsingError) {
    return new ImportError(
      `Failed to parse FIT file: ${error.message}`,
      format,
      error
    );
  }

  if (error instanceof TcxParsingError) {
    return new ImportError(
      `Failed to parse TCX file: ${error.message}`,
      format,
      error
    );
  }

  if (error instanceof ZwiftParsingError) {
    return new ImportError(
      `Failed to parse ZWO file: ${error.message}`,
      format,
      error
    );
  }

  if (error instanceof KrdValidationError) {
    const errorMessages = error.errors
      .map((e) => `${e.field}: ${e.message}`)
      .join(", ");
    return new ImportError(
      `Validation failed: ${errorMessages}`,
      format,
      error
    );
  }

  return new ImportError(
    `Failed to import ${format.toUpperCase()} file: ${error instanceof Error ? error.message : String(error)}`,
    format,
    error
  );
};
