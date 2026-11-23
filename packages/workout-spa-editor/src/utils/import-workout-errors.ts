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

type WrapInput = {
  key: ImportErrorCopy["key"];
  label: string;
  detail: string;
  message: string;
  format: WorkoutFileFormat;
  cause: unknown;
};

type ImportErrorFacts = Omit<WrapInput, "format" | "cause">;

const wrap = ({ key, label, detail, message, format, cause }: WrapInput) =>
  new ImportError(message, format, cause, {
    key,
    params: { format: label, detail },
  });

const parseFailed = (
  label: string,
  detail: string,
  loc = ""
): ImportErrorFacts => {
  const message = `Failed to parse ${label} file: ${detail}${loc}`;
  return { key: "parseFailed", label, detail, message };
};

const describeError = (error: unknown, label: string): ImportErrorFacts => {
  if (error instanceof FileParsingError) {
    const loc =
      error.line !== undefined && error.column !== undefined
        ? ` (line ${error.line}, column ${error.column})`
        : "";
    return parseFailed(label, error.message, loc);
  }
  if (error instanceof ValidationError || error instanceof KrdValidationError) {
    const detail = fmtValidation(error.errors);
    const message = `Validation failed: ${detail}`;
    return { key: "validationFailed", label, detail, message };
  }
  if (error instanceof ConversionError) {
    const detail = error.message + (error.details ? ` (${error.details})` : "");
    const message = `Conversion failed: ${detail}`;
    return { key: "conversionFailed", label, detail, message };
  }
  for (const [cls, name] of parsingErrors) {
    if (error instanceof cls) return parseFailed(name, error.message);
  }
  const detail = errorMessage(error);
  const message = `Failed to import ${label} file: ${detail}`;
  return { key: "importFailed", label, detail, message };
};

export const transformError = (
  error: unknown,
  format: WorkoutFileFormat
): ImportError => {
  if (error instanceof ImportError) return error;
  const facts = describeError(error, format.toUpperCase());
  return wrap({ ...facts, format, cause: error });
};
