import { mapErrorToExitCode } from "../../utils/error-exit-code.js";
import { formatError } from "../../utils/error-formatter.js";

export const handleExtractWorkoutError = (error: unknown): number => {
  console.error(formatError(error, { json: false }));

  return mapErrorToExitCode(error);
};
