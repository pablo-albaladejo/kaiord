import { loadConfigWithMetadata } from "./config-loader.js";
import { mapErrorToExitCode } from "./error-exit-code.js";
import { formatError } from "./error-formatter.js";
import type { ExitCodeValue } from "./exit-codes.js";

type HandleCommandErrorOptions = {
  json?: boolean | undefined;
  /** Wrap the JSON error in a second `{ success: false, error }` envelope. */
  envelope?: boolean;
};

/**
 * Whether JSON output was requested, for a command that is failing. Reads
 * only the `json` option, so it holds even when other options are invalid
 * (the command may be failing precisely because of them), and falls back to
 * the `.kaiordrc.json` default when the flag is absent.
 */
export const resolveJsonFlag = async (options: unknown): Promise<boolean> => {
  const raw =
    options !== null && typeof options === "object"
      ? (options as { json?: unknown }).json
      : undefined;
  if (typeof raw === "boolean") return raw;
  const { config } = await loadConfigWithMetadata();
  return config.json ?? false;
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
