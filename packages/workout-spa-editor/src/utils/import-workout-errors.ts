/** Import error transformation utilities */

import {
  FitParsingError,
  KrdValidationError,
  TcxParsingError,
  ZwiftParsingError,
} from "@kaiord/core";
import { ImportError } from "./import-workout";
import {
  ConversionError,
  FileParsingError,
  ValidationError,
} from "../types/errors";
import type { WorkoutFileFormat } from "./file-format-detector";

const formatValidationError = (
  errors: Array<{ field: string; message: string }>
): string => errors.map((e) => `${e.field}: ${e.message}`).join(", ");

export const transformError = (
  error: unknown,
  format: WorkoutFileFormat
): ImportError => {
  if (error instanceof ImportError) return error;
  if (error instanceof FileParsingError) {
    const msg = `Failed to parse ${format.toUpperCase()} file: ${error.message}`;
    const loc =
      error.line !== undefined && error.column !== undefined
        ? ` (line ${error.line}, column ${error.column})`
        : "";
    return new ImportError(msg + loc, format, error);
  }
  if (error instanceof ValidationError) {
    return new ImportError(
      `Validation failed: ${formatValidationError(error.errors)}`,
      format,
      error
    );
  }
  if (error instanceof ConversionError) {
    const msg = `Conversion failed: ${error.message}`;
    const details = error.details ? ` (${error.details})` : "";
    return new ImportError(msg + details, format, error);
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
    return new ImportError(
      `Validation failed: ${formatValidationError(error.errors)}`,
      format,
      error
    );
  }
  const msg = error instanceof Error ? error.message : String(error);
  return new ImportError(
    `Failed to import ${format.toUpperCase()} file: ${msg}`,
    format,
    error
  );
};
