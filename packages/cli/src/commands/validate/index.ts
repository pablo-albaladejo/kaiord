import ora from "ora";
import {
  loadConfigWithMetadata,
  mergeWithConfig,
} from "../../utils/config-loader.js";
import { formatError } from "../../utils/error-formatter.js";
import { ExitCode } from "../../utils/exit-codes.js";
import { detectFormat } from "../../utils/format-detector.js";
import { createLogger } from "../../utils/logger-factory.js";
import { executeValidation } from "./execute-validation";
import {
  formatValidationFailure,
  formatValidationSuccess,
} from "./format-results";
import { validateOptionsSchema } from "./types";

export const validateCommand = async (options: unknown): Promise<number> => {
  let logger: Awaited<ReturnType<typeof createLogger>> | undefined;
  let spinner: ReturnType<typeof ora> | null = null;

  try {
    const configResult = await loadConfigWithMetadata();
    const { config } = configResult;
    const mergedOptions = mergeWithConfig(
      options as Record<string, unknown>,
      config
    );

    const optionsWithDefaults = {
      ...mergedOptions,
      toleranceConfig:
        mergedOptions.toleranceConfig || config.defaultToleranceConfig,
      verbose: mergedOptions.verbose ?? config.verbose,
      quiet: mergedOptions.quiet ?? config.quiet,
      json: mergedOptions.json ?? config.json,
      logFormat: mergedOptions.logFormat || config.logFormat,
    };

    const opts = validateOptionsSchema.parse(optionsWithDefaults);
    logger = await createLogger({
      type: opts.logFormat,
      level: opts.verbose ? "debug" : opts.quiet ? "error" : "info",
      quiet: opts.quiet,
    });

    if (configResult.loadedFrom) {
      logger.debug("Configuration loaded", { path: configResult.loadedFrom });
    } else {
      logger.debug("No configuration file found", {
        searchedPaths: configResult.searchedPaths,
      });
    }

    spinner =
      opts.quiet || opts.json
        ? null
        : ora("Validating round-trip conversion...").start();

    const violations = await executeValidation(opts, logger);
    const format = detectFormat(opts.input) ?? "fit";

    if (spinner) {
      if (violations.length === 0) {
        spinner.succeed("Validation complete - no tolerance violations");
      } else {
        spinner.fail(
          `Validation failed - ${violations.length} tolerance violation(s)`
        );
      }
    }

    if (violations.length === 0) {
      logger.info("Round-trip validation passed");
      formatValidationSuccess(opts, opts.input, format);
      return ExitCode.SUCCESS;
    }

    logger.warn("Round-trip validation failed", {
      violationCount: violations.length,
    });
    formatValidationFailure(opts, opts.input, format, violations);
    return ExitCode.TOLERANCE_EXCEEDED;
  } catch (error) {
    logger?.error("Validation failed", { error });

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
  } finally {
    spinner?.stop();
  }
};
