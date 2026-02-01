import {
  createDefaultProviders,
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";
import { loadConfig, mergeWithConfig } from "../../utils/config-loader.js";
import { formatError } from "../../utils/error-formatter";
import { ExitCode, type ExitCodeValue } from "../../utils/exit-codes";
import { createLogger } from "../../utils/logger-factory";
import { executeBatchConversion } from "./batch";
import { executeSingleFileConversion } from "./single-file";
import { convertOptionsSchema, type ConvertOptions } from "./types";

export type { ConvertOptions } from "./types";

/**
 * Detect if input contains glob patterns
 */
const isBatchMode = (input: string): boolean => {
  return input.includes("*") || input.includes("?");
};

/**
 * Main convert command handler
 */
export const convertCommand = async (
  options: ConvertOptions
): Promise<number> => {
  const config = await loadConfig();
  const mergedOptions = mergeWithConfig(options, config);

  const optionsWithDefaults = {
    ...mergedOptions,
    inputFormat: mergedOptions.inputFormat || config.defaultInputFormat,
    outputFormat: mergedOptions.outputFormat || config.defaultOutputFormat,
    outputDir: mergedOptions.outputDir || config.defaultOutputDir,
    verbose: mergedOptions.verbose ?? config.verbose,
    quiet: mergedOptions.quiet ?? config.quiet,
    json: mergedOptions.json ?? config.json,
    logFormat: mergedOptions.logFormat || config.logFormat,
  };

  const validatedOptions = convertOptionsSchema.parse(optionsWithDefaults);

  const logger = await createLogger({
    type: validatedOptions.logFormat,
    level: validatedOptions.verbose
      ? "debug"
      : validatedOptions.quiet
        ? "error"
        : "info",
    quiet: validatedOptions.quiet,
  });

  try {
    const providers = createDefaultProviders(logger);

    if (isBatchMode(validatedOptions.input)) {
      return await executeBatchConversion(validatedOptions, providers, logger);
    } else {
      await executeSingleFileConversion(validatedOptions, providers, logger);
      return ExitCode.SUCCESS;
    }
  } catch (error) {
    logger.error("Conversion failed", { error });

    const formattedError = formatError(error, {
      json: validatedOptions.json,
    });

    if (validatedOptions.json) {
      console.log(formattedError);
    } else {
      console.error(formattedError);
    }

    let exitCode: ExitCodeValue = ExitCode.UNKNOWN_ERROR;

    if (error instanceof Error) {
      if (error.message.includes("File not found")) {
        exitCode = ExitCode.FILE_NOT_FOUND;
      } else if (error.message.includes("Permission denied")) {
        exitCode = ExitCode.PERMISSION_DENIED;
      } else if (error instanceof FitParsingError) {
        exitCode = ExitCode.PARSING_ERROR;
      } else if (error instanceof KrdValidationError) {
        exitCode = ExitCode.VALIDATION_ERROR;
      } else if (error instanceof ToleranceExceededError) {
        exitCode = ExitCode.TOLERANCE_EXCEEDED;
      } else if (error.name === "InvalidArgumentError") {
        exitCode = ExitCode.INVALID_ARGUMENT;
      }
    }

    return exitCode;
  }
};
