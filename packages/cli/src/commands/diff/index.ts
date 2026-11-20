import {
  loadConfigWithMetadata,
  mergeWithConfig,
} from "../../utils/config-loader.js";
import { ExitCode } from "../../utils/exit-codes.js";
import {
  handleCommandError,
  resolveJsonFlag,
} from "../../utils/handle-command-error.js";
import { createLogger } from "../../utils/logger-factory.js";
import { computeDiff, printDiffResult } from "./diff-executor";
import { type DiffOptions, diffOptionsSchema } from "./types";

export type { DiffOptions } from "./types";

/**
 * Diff command - compare two workout files
 */
export const diffCommand = async (options: DiffOptions): Promise<number> => {
  let logger: Awaited<ReturnType<typeof createLogger>> | undefined;

  try {
    const configResult = await loadConfigWithMetadata();
    const validatedOptions = diffOptionsSchema.parse(
      mergeWithConfig(options, configResult.config)
    );
    logger = await createLogger({
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

    const result = await computeDiff(validatedOptions, logger);
    printDiffResult(result, validatedOptions);
    return result.identical ? ExitCode.SUCCESS : ExitCode.DIFFERENCES_FOUND;
  } catch (error) {
    logger?.error("Diff command failed", { error });
    return handleCommandError(error, {
      json: await resolveJsonFlag(options),
    });
  }
};
