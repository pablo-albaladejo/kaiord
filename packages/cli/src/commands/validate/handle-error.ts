import { formatError } from "../../utils/error-formatter.js";
import { ExitCode } from "../../utils/exit-codes.js";
import { validateOptionsSchema } from "./types.js";

export const handleValidationError = (
  error: unknown,
  options: unknown
): number => {
  let jsonOutput = false;
  try {
    const opts = validateOptionsSchema.parse(options);
    jsonOutput = opts.json || false;
  } catch {
    // If options parsing failed, use default formatting
  }

  if (jsonOutput) {
    const errorObj = formatError(error, { json: true });
    const errorData =
      typeof errorObj === "string" ? JSON.parse(errorObj) : errorObj;
    console.log(
      JSON.stringify({ success: false, error: errorData }, null, 2)
    );
  } else {
    console.error(formatError(error, { json: false }));
  }

  if (error instanceof Error) {
    if (error.message.includes("File not found")) {
      return ExitCode.FILE_NOT_FOUND;
    }
    if (
      error.message.includes("only supports") ||
      error.message.includes("Unable to detect")
    ) {
      return ExitCode.INVALID_ARGUMENT;
    }
  }

  return ExitCode.UNKNOWN_ERROR;
};
