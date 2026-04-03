import { formatError } from "../../utils/error-formatter.js";
import { ExitCode } from "../../utils/exit-codes.js";

export const handleExtractWorkoutError = (error: unknown): number => {
  console.error(formatError(error, { json: false }));

  if (error instanceof Error) {
    if (error.message.includes("File not found")) {
      return ExitCode.FILE_NOT_FOUND;
    }
    if (error.message.includes("Unable to detect")) {
      return ExitCode.INVALID_ARGUMENT;
    }
    if (error.message.includes("Expected type")) {
      return ExitCode.VALIDATION_ERROR;
    }
  }

  return ExitCode.UNKNOWN_ERROR;
};
