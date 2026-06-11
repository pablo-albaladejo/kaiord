import ora from "ora";

import type { Config } from "../../utils/config-loader.js";
import {
  loadConfigWithMetadata,
  mergeWithConfig,
} from "../../utils/config-loader.js";
import { ExitCode } from "../../utils/exit-codes.js";
import { detectFormat } from "../../utils/format-detector.js";
import { createLogger } from "../../utils/logger-factory.js";
import { executeValidation } from "./execute-validation.js";
import {
  formatValidationFailure,
  formatValidationSuccess,
} from "./format-results.js";
import { handleValidationError } from "./handle-error.js";
import type { ValidateOptions } from "./types.js";
import { validateOptionsSchema } from "./types.js";

type Logger = Awaited<ReturnType<typeof createLogger>>;

const applyConfigDefaults = (
  options: Record<string, unknown>,
  config: Config
): Record<string, unknown> => {
  const merged = mergeWithConfig(options, config);
  return {
    ...merged,
    toleranceConfig: merged.toleranceConfig || config.defaultToleranceConfig,
    verbose: merged.verbose ?? config.verbose,
    quiet: merged.quiet ?? config.quiet,
    json: merged.json ?? config.json,
    logFormat: merged.logFormat || config.logFormat,
  };
};

const logConfigSource = (
  logger: Logger,
  loadedFrom: string | null,
  searchedPaths: Array<string>
): void => {
  if (loadedFrom) {
    logger.debug("Configuration loaded", { path: loadedFrom });
  } else {
    logger.debug("No configuration file found", { searchedPaths });
  }
};

const updateSpinner = (
  spinner: ReturnType<typeof ora> | null,
  violationCount: number
): void => {
  if (!spinner) return;
  if (violationCount === 0) {
    spinner.succeed("Validation complete - no tolerance violations");
  } else {
    spinner.fail(
      `Validation failed - ${violationCount} tolerance violation(s)`
    );
  }
};

const runValidation = async (
  opts: ValidateOptions,
  logger: Logger,
  spinner: ReturnType<typeof ora> | null
): Promise<number> => {
  const violations = await executeValidation(opts, logger);
  const format = detectFormat(opts.input) ?? "fit";
  updateSpinner(spinner, violations.length);
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
};

export const validateCommand = async (options: unknown): Promise<number> => {
  let logger: Logger | undefined;
  let spinner: ReturnType<typeof ora> | null = null;

  try {
    const configResult = await loadConfigWithMetadata();
    const opts = validateOptionsSchema.parse(
      applyConfigDefaults(
        options as Record<string, unknown>,
        configResult.config
      )
    );
    logger = await createLogger({
      type: opts.logFormat,
      level: opts.verbose ? "debug" : opts.quiet ? "error" : "info",
      quiet: opts.quiet,
    });
    logConfigSource(
      logger,
      configResult.loadedFrom,
      configResult.searchedPaths
    );
    spinner =
      opts.quiet || opts.json
        ? null
        : ora("Validating round-trip conversion...").start();
    return await runValidation(opts, logger, spinner);
  } catch (error) {
    logger?.error("Validation failed", { error });
    return handleValidationError(error, options);
  } finally {
    spinner?.stop();
  }
};
