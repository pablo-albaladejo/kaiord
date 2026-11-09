import {
  loadConfigWithMetadata,
  mergeWithConfig,
} from "../../utils/config-loader.js";
import { ExitCode } from "../../utils/exit-codes.js";
import { handleCommandError } from "../../utils/handle-command-error.js";
import { createLogger } from "../../utils/logger-factory.js";
import { computeDiff, printDiffResult } from "./diff-executor";
import { type DiffOptions, diffOptionsSchema } from "./types";

export type { DiffOptions } from "./types";

/**
 * Diff command - compare two workout files
 */
export const diffCommand = async (options: DiffOptions): Promise<number> => {
  const configResult = await loadConfigWithMetadata();
  const { config } = configResult;
  const validatedOptions = diffOptionsSchema.parse(
    mergeWithConfig(options, config)
  );

  const logger = await createLogger({
    type: validatedOptions.logFormat,
    level: validatedOptions.verbose
      ? "debug"
      : validatedOptions.quiet
        ? "error"
        : "info",
    quiet: validatedOptions.quiet,
  });

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
    return handleCommandError(error, { json: validatedOptions.json });
  }
};
