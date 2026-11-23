/** Import error transformation utilities */

import {
  FitParsingError,
  GarminParsingError,
  KrdValidationError,
  TcxParsingError,
  ZwiftParsingError,
} from "@kaiord/core";

import {
  ConversionError,
  FileParsingError,
  ValidationError,
} from "../types/errors";
import { errorMessage } from "./error-message";
import type { WorkoutFileFormat } from "./file-format-detector";
import { ImportError, type ImportErrorCopy } from "./import-workout";

const fmtValidation = (
  errors: Array<{ field: string; message: string }>
): string => errors.map((e) => `${e.field}: ${e.message}`).join(", ");

const parsingErrors: ReadonlyArray<[new (...args: never[]) => Error, string]> =
  [
    [FitParsingError, "FIT"],
    [TcxParsingError, "TCX"],
    [ZwiftParsingError, "ZWO"],
    [GarminParsingError, "GCN"],
  ];

const wrap = (
  key: ImportErrorCopy["key"],
  label: string,
  detail: string,
  format: WorkoutFileFormat,
  cause: unknown,
  message: string
): ImportError =>
  new ImportError(message, format, cause, {
    key,
    params: { format: label, detail },
  });

export const transformError = (
  error: unknown,
  format: WorkoutFileFormat
): ImportError => {
  if (error instanceof ImportError) return error;
  const label = format.toUpperCase();
  if (error instanceof FileParsingError) {
    const loc =
      error.line !== undefined && error.column !== undefined
        ? ` (line ${error.line}, column ${error.column})`
        : "";
    const msg = `Failed to parse ${label} file: ${error.message}`;
    return wrap("parseFailed", label, error.message, format, error, msg + loc);
  }
  if (error instanceof ValidationError || error instanceof KrdValidationError) {
    const detail = fmtValidation(error.errors);
    const msg = `Validation failed: ${detail}`;
    return wrap("validationFailed", label, detail, format, error, msg);
  }
  if (error instanceof ConversionError) {
    const detail = error.message + (error.details ? ` (${error.details})` : "");
    const msg = `Conversion failed: ${detail}`;
    return wrap("conversionFailed", label, detail, format, error, msg);
  }
  for (const [cls, name] of parsingErrors) {
    if (error instanceof cls) {
      const msg = `Failed to parse ${name} file: ${error.message}`;
      return wrap("parseFailed", name, error.message, format, error, msg);
    }
  }
  const detail = errorMessage(error);
  const msg = `Failed to import ${label} file: ${detail}`;
  return wrap("importFailed", label, detail, format, error, msg);
};
