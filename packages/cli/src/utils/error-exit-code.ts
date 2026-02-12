import type { ExitCodeValue } from "./exit-codes.js";
import { ExitCode } from "./exit-codes.js";

const ERROR_NAME_TO_EXIT_CODE: Record<string, ExitCodeValue> = {
  FitParsingError: ExitCode.PARSING_ERROR,
  GarminParsingError: ExitCode.PARSING_ERROR,
  KrdValidationError: ExitCode.VALIDATION_ERROR,
  ToleranceExceededError: ExitCode.TOLERANCE_EXCEEDED,
  InvalidArgumentError: ExitCode.INVALID_ARGUMENT,
};

export const getExitCodeForError = (error: unknown): ExitCodeValue => {
  if (error && typeof error === "object" && "name" in error) {
    const errorName = (error as { name: string }).name;
    return ERROR_NAME_TO_EXIT_CODE[errorName] ?? ExitCode.UNKNOWN_ERROR;
  }
  return ExitCode.UNKNOWN_ERROR;
};
