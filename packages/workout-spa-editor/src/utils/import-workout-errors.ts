/** Import error transformation utilities */

import {
  FitParsingError,
  GarminParsingError,
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

const fmtValidation = (
  errors: Array<{ field: string; message: string }>
): string => errors.map((e) => `${e.field}: ${e.message}`).join(", ");

const parsingErrorMap: Record<string, new (...args: never[]) => Error> = {
  FitParsingError: FitParsingError,
  TcxParsingError: TcxParsingError,
  ZwiftParsingError: ZwiftParsingError,
  GarminParsingError: GarminParsingError,
};

const formatLabel: Record<string, string> = {
  FitParsingError: "FIT",
  TcxParsingError: "TCX",
  ZwiftParsingError: "ZWO",
  GarminParsingError: "GCN",
};

export const transformError = (
  error: unknown,
  format: WorkoutFileFormat
): ImportError => {
  if (error instanceof ImportError) return error;
  if (error instanceof FileParsingError) {
    const loc =
      error.line !== undefined && error.column !== undefined
        ? ` (line ${error.line}, column ${error.column})`
        : "";
    const msg = `Failed to parse ${format.toUpperCase()} file: ${error.message}`;
    return new ImportError(msg + loc, format, error);
  }
  if (error instanceof ValidationError) {
    return new ImportError(
      `Validation failed: ${fmtValidation(error.errors)}`,
      format,
      error
    );
  }
  if (error instanceof ConversionError) {
    const details = error.details ? ` (${error.details})` : "";
    return new ImportError(
      `Conversion failed: ${error.message}${details}`,
      format,
      error
    );
  }
  for (const [name, label] of Object.entries(formatLabel)) {
    if (error instanceof parsingErrorMap[name]) {
      return new ImportError(
        `Failed to parse ${label} file: ${(error as Error).message}`,
        format,
        error
      );
    }
  }
  if (error instanceof KrdValidationError) {
    return new ImportError(
      `Validation failed: ${fmtValidation(error.errors)}`,
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
