import {
  FitParsingError,
  GarminParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";
import { ExitCode, type ExitCodeValue } from "../../utils/exit-codes";

/**
 * Map a conversion error to the appropriate CLI exit code
 */
export const mapErrorToExitCode = (error: unknown): ExitCodeValue => {
  if (!(error instanceof Error)) return ExitCode.UNKNOWN_ERROR;

  if (error.message.includes("File not found")) {
    return ExitCode.FILE_NOT_FOUND;
  }
  if (error.message.includes("Permission denied")) {
    return ExitCode.PERMISSION_DENIED;
  }
  if (error instanceof FitParsingError) return ExitCode.PARSING_ERROR;
  if (error instanceof GarminParsingError) return ExitCode.PARSING_ERROR;
  if (error instanceof KrdValidationError) return ExitCode.VALIDATION_ERROR;
  if (error instanceof ToleranceExceededError) {
    return ExitCode.TOLERANCE_EXCEEDED;
  }
  if (error.name === "InvalidArgumentError") {
    return ExitCode.INVALID_ARGUMENT;
  }

  return ExitCode.UNKNOWN_ERROR;
};
