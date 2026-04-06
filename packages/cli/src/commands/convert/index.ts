import type { Config } from "../../utils/config-loader.js";
import {
  loadConfigWithMetadata,
  mergeWithConfig,
} from "../../utils/config-loader.js";
import { formatError } from "../../utils/error-formatter";
import { ExitCode } from "../../utils/exit-codes";
import { createLogger } from "../../utils/logger-factory";
import { executeBatchConversion } from "./batch";
import { mapErrorToExitCode } from "./error-exit-code";
import { executeSingleFileConversion } from "./single-file";
import { convertOptionsSchema, type ConvertOptions } from "./types";

export type { ConvertOptions } from "./types";

/**
 * Detect if input contains glob patterns
 */
const isBatchMode = (input: string): boolean =>
  input.includes("*") || input.includes("?");

/**
 * Merge CLI options with config file defaults
 */
const resolveOptions = (options: ConvertOptions, config: Config) => {
  const merged = mergeWithConfig(options, config);
  return convertOptionsSchema.parse({
    ...merged,
    inputFormat: merged.inputFormat || config.defaultInputFormat,
    outputFormat: merged.outputFormat || config.defaultOutputFormat,
    outputDir: merged.outputDir || config.defaultOutputDir,
    verbose: merged.verbose ?? config.verbose,
    quiet: merged.quiet ?? config.quiet,
    json: merged.json ?? config.json,
    logFormat: merged.logFormat || config.logFormat,
  });
};

/**
 * Main convert command handler
 */
export const convertCommand = async (
  options: ConvertOptions
): Promise<number> => {
  const configResult = await loadConfigWithMetadata();
  const validatedOptions = resolveOptions(options, configResult.config);

  if (validatedOptions.output && validatedOptions.outputDir) {
    const error = new Error(
      "Cannot use both --output and --output-dir. " +
        "Use --output for single file, --output-dir for batch conversion."
    );
    error.name = "InvalidArgumentError";
    throw error;
  }

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
    if (isBatchMode(validatedOptions.input)) {
      return await executeBatchConversion(validatedOptions, logger);
    }
    await executeSingleFileConversion(validatedOptions, logger);
    return ExitCode.SUCCESS;
  } catch (error) {
    logger.error("Conversion failed", { error });
    const formatted = formatError(error, { json: validatedOptions.json });

    if (validatedOptions.json) console.log(formatted);
    else console.error(formatted);

    return mapErrorToExitCode(error);
  }
};
