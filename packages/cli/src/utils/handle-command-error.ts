import type { ZodType } from "zod";

import { mapErrorToExitCode } from "./error-exit-code.js";
import { formatError } from "./error-formatter.js";
import type { ExitCodeValue } from "./exit-codes.js";

type HandleCommandErrorOptions = {
  json?: boolean | undefined;
  /** Wrap the JSON error in a second `{ success: false, error }` envelope. */
  envelope?: boolean;
};

/**
 * Whether `--json` was requested, tolerating options that fail their schema
 * (the command may be failing precisely because its options are invalid).
 */
export const resolveJsonFlag = (
  schema: ZodType<{ json?: boolean }>,
  options: unknown
): boolean => {
  const parsed = schema.safeParse(options);
  return parsed.success ? parsed.data.json || false : false;
};

/**
 * Print a command failure (stdout JSON or stderr text) and return its exit code.
 */
export const handleCommandError = (
  error: unknown,
  { json, envelope = false }: HandleCommandErrorOptions
): ExitCodeValue => {
  if (json) {
    const formatted = formatError(error, { json: true });
    console.log(
      envelope
        ? JSON.stringify(
            { success: false, error: JSON.parse(formatted) },
            null,
            2
          )
        : formatted
    );
  } else {
    console.error(formatError(error, { json: false }));
  }

  return mapErrorToExitCode(error);
};
