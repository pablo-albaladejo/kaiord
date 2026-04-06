import { loadConfigWithMetadata } from "../../utils/config-loader.js";
import { formatError } from "../../utils/error-formatter.js";
import { ExitCode } from "../../utils/exit-codes.js";
import { createLogger } from "../../utils/logger-factory.js";
import { computeDiff, printDiffResult } from "./diff-executor";
import { diffOptionsSchema, type DiffOptions } from "./types";

export type { DiffOptions } from "./types";

/**
 * Diff command - compare two workout files
 */
export const diffCommand = async (options: DiffOptions): Promise<number> => {
  const validatedOptions = diffOptionsSchema.parse(options);

  const logger = await createLogger({
    type: validatedOptions.logFormat,
    level: validatedOptions.verbose
      ? "debug"
      : validatedOptions.quiet
        ? "error"
        : "info",
    quiet: validatedOptions.quiet,
  });

  const configResult = await loadConfigWithMetadata();
  if (configResult.loadedFrom) {
    logger.debug("Configuration loaded", { path: configResult.loadedFrom });
  } else {
    logger.debug("No configuration file found", {
      searchedPaths: configResult.searchedPaths,
    });
  }

  try {
    const result = await computeDiff(validatedOptions, logger);
    printDiffResult(result, validatedOptions);
    return result.identical ? ExitCode.SUCCESS : ExitCode.DIFFERENCES_FOUND;
  } catch (error) {
    logger.error("Diff command failed", { error });
    const formatted = formatError(error, { json: validatedOptions.json });

    if (validatedOptions.json) console.log(formatted);
    else console.error(formatted);

    return ExitCode.UNKNOWN_ERROR;
  }
};
