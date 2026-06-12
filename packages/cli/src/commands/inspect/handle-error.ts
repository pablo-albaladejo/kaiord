import { mapErrorToExitCode } from "../../utils/error-exit-code.js";
import { formatError } from "../../utils/error-formatter.js";
import { inspectOptionsSchema } from "./types.js";

export const handleInspectError = (
  error: unknown,
  options: unknown
): number => {
  let jsonOutput = false;
  try {
    const opts = inspectOptionsSchema.parse(options);
    jsonOutput = opts.json || false;
  } catch {
    // If options parsing failed, use default formatting
  }

  if (jsonOutput) {
    const errorObj = formatError(error, { json: true });
    const errorData =
      typeof errorObj === "string" ? JSON.parse(errorObj) : errorObj;
    console.log(JSON.stringify({ success: false, error: errorData }, null, 2));
  } else {
    console.error(formatError(error, { json: false }));
  }

  return mapErrorToExitCode(error);
};
