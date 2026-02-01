/**
 * JSON error formatter for CLI output
 */
import {
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";
import { getSuggestionForError } from "./error-suggestions";

type JsonErrorResult = {
  success: false;
  error: Record<string, unknown>;
};

const toJson = (result: JsonErrorResult): string => {
  return JSON.stringify(result, null, 2);
};

const formatFitError = (error: FitParsingError): string =>
  toJson({
    success: false,
    error: {
      type: "FitParsingError",
      message: error.message,
      cause: error.cause ? String(error.cause) : undefined,
      suggestion: "Verify the file is a valid FIT workout file.",
    },
  });

const formatKrdError = (error: KrdValidationError): string =>
  toJson({
    success: false,
    error: {
      type: "KrdValidationError",
      message: error.message,
      errors: error.errors,
      suggestion: "Check the KRD file against the schema.",
    },
  });

const formatToleranceError = (error: ToleranceExceededError): string =>
  toJson({
    success: false,
    error: {
      type: "ToleranceExceededError",
      message: error.message,
      violations: error.violations,
      suggestion: "Consider adjusting tolerance values if acceptable.",
    },
  });

const formatGenericError = (error: Error): string => {
  const suggestion = getSuggestionForError(error);
  return toJson({
    success: false,
    error: {
      type: error.name || "Error",
      message: error.message,
      suggestion: suggestion ? suggestion.join(" ") : undefined,
    },
  });
};

const formatUnknownError = (error: unknown): string =>
  toJson({
    success: false,
    error: {
      type: "UnknownError",
      message: String(error),
    },
  });

/**
 * Format error as JSON output
 */
export const formatErrorAsJson = (error: unknown): string => {
  if (error instanceof FitParsingError) return formatFitError(error);
  if (error instanceof KrdValidationError) return formatKrdError(error);
  if (error instanceof ToleranceExceededError) return formatToleranceError(error);
  if (error instanceof Error) return formatGenericError(error);
  return formatUnknownError(error);
};
