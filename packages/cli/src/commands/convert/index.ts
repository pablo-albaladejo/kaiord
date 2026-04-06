import { executeBatchConversion } from "./batch";
import { mapErrorToExitCode } from "./error-exit-code";
import { executeSingleFileConversion } from "./single-file";
import { convertOptionsSchema } from "./types";
import {
  loadConfigWithMetadata,
  mergeWithConfig,
} from "../../utils/config-loader.js";
import { formatError } from "../../utils/error-formatter";
import { ExitCode } from "../../utils/exit-codes";
import { createLogger } from "../../utils/logger-factory";
import type { ConvertOptions } from "./types";
import type { Config } from "../../utils/config-loader.js";

export type { ConvertOptions } from "./types";

const isBatchMode = (input: string): boolean =>
  input.includes("*") || input.includes("?");

const resolveOptions = (options: ConvertOptions, config: Config) => {
  const merged = mergeWithConfig(options, config);
  const batch = typeof merged.input === "string" && isBatchMode(merged.input);
  return convertOptionsSchema.parse({
    ...merged,
    inputFormat: merged.inputFormat || config.defaultInputFormat,
    outputFormat: merged.outputFormat || config.defaultOutputFormat,
    outputDir:
      merged.outputDir || (batch ? config.defaultOutputDir : undefined),
    verbose: merged.verbose ?? config.verbose,
    quiet: merged.quiet ?? config.quiet,
    json: merged.json ?? config.json,
    logFormat: merged.logFormat || config.logFormat,
  });
};

const validateExclusiveOutput = (opts: {
  output?: string;
  outputDir?: string;
}) => {
  if (opts.output && opts.outputDir) {
    const error = new Error(
      "Cannot use both --output and --output-dir. " +
        "Use --output for single file, --output-dir for batch conversion."
    );
    error.name = "InvalidArgumentError";
    throw error;
  }
};

export const convertCommand = async (
  options: ConvertOptions
): Promise<number> => {
  const configResult = await loadConfigWithMetadata();
  const validated = resolveOptions(options, configResult.config);
  validateExclusiveOutput(validated);

  const logger = await createLogger({
    type: validated.logFormat,
    level: validated.verbose ? "debug" : validated.quiet ? "error" : "info",
    quiet: validated.quiet,
  });

  if (configResult.loadedFrom)
    logger.debug("Configuration loaded", { path: configResult.loadedFrom });
  else
    logger.debug("No configuration file found", {
      searchedPaths: configResult.searchedPaths,
    });

  try {
    if (isBatchMode(validated.input)) {
      return await executeBatchConversion(validated, logger);
    }
    await executeSingleFileConversion(validated, logger);
    return ExitCode.SUCCESS;
  } catch (error) {
    logger.error("Conversion failed", { error });
    const formatted = formatError(error, { json: validated.json });
    if (validated.json) console.log(formatted);
    else console.error(formatted);
    return mapErrorToExitCode(error);
  }
};
