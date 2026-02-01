/**
 * JSON error formatter for CLI output
 */
import {
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";
import { getSuggestionForError } from "./error-suggestions";

/**
 * Format error as JSON output
 */
export const formatErrorAsJson = (error: unknown): string => {
  if (error instanceof FitParsingError) {
    return JSON.stringify(
      {
        success: false,
        error: {
          type: "FitParsingError",
          message: error.message,
          cause: error.cause ? String(error.cause) : undefined,
          suggestion: "Verify the file is a valid FIT workout file.",
        },
      },
      null,
      2
    );
  }

  if (error instanceof KrdValidationError) {
    return JSON.stringify(
      {
        success: false,
        error: {
          type: "KrdValidationError",
          message: error.message,
          errors: error.errors,
          suggestion: "Check the KRD file against the schema.",
        },
      },
      null,
      2
    );
  }

  if (error instanceof ToleranceExceededError) {
    return JSON.stringify(
      {
        success: false,
        error: {
          type: "ToleranceExceededError",
          message: error.message,
          violations: error.violations,
          suggestion: "Consider adjusting tolerance values if acceptable.",
        },
      },
      null,
      2
    );
  }

  if (error instanceof Error) {
    const suggestion = getSuggestionForError(error);
    return JSON.stringify(
      {
        success: false,
        error: {
          type: error.name || "Error",
          message: error.message,
          suggestion: suggestion ? suggestion.join(" ") : undefined,
        },
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      success: false,
      error: {
        type: "UnknownError",
        message: String(error),
      },
    },
    null,
    2
  );
};
