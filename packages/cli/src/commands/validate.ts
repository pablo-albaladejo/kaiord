import type { ToleranceConfig } from "@kaiord/core";
import {
  createDefaultProviders,
  createToleranceChecker,
  toleranceConfigSchema,
  validateRoundTrip,
} from "@kaiord/core";
import { createFitProviders } from "@kaiord/fit";
import { createGarminProviders } from "@kaiord/garmin";
import { createTcxProviders } from "@kaiord/tcx";
import { createZwoProviders } from "@kaiord/zwo";
import { readFile as fsReadFile } from "fs/promises";
import ora from "ora";
import { z } from "zod";
import {
  loadConfigWithMetadata,
  mergeWithConfig,
} from "../utils/config-loader.js";
import {
  formatError,
  formatToleranceViolations,
} from "../utils/error-formatter.js";
import { ExitCode } from "../utils/exit-codes.js";
import { readFile } from "../utils/file-handler.js";
import { detectFormat } from "../utils/format-detector.js";
import { createLogger } from "../utils/logger-factory.js";

const validateOptionsSchema = z.object({
  input: z.string(),
  toleranceConfig: z.string().optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
  logFormat: z.enum(["pretty", "json"]).optional(),
});

export const validateCommand = async (options: unknown): Promise<number> => {
  let logger: Awaited<ReturnType<typeof createLogger>> | undefined;
  let spinner: ReturnType<typeof ora> | null = null;

  try {
    // Load config file defaults with metadata for logging
    const configResult = await loadConfigWithMetadata();
    const { config } = configResult;

    // Merge CLI options with config defaults (CLI takes precedence)
    const mergedOptions = mergeWithConfig(
      options as Record<string, unknown>,
      config
    );

    // Apply config defaults to options
    const optionsWithDefaults = {
      ...mergedOptions,
      toleranceConfig:
        mergedOptions.toleranceConfig || config.defaultToleranceConfig,
      verbose: mergedOptions.verbose ?? config.verbose,
      quiet: mergedOptions.quiet ?? config.quiet,
      json: mergedOptions.json ?? config.json,
      logFormat: mergedOptions.logFormat || config.logFormat,
    };

    // Parse and validate options
    const opts = validateOptionsSchema.parse(optionsWithDefaults);

    // Create logger
    const loggerType =
      opts.logFormat === "json" ? "structured" : opts.logFormat;
    logger = await createLogger({
      type: loggerType,
      level: opts.verbose ? "debug" : opts.quiet ? "error" : "info",
      quiet: opts.quiet,
    });

    // Log config discovery in verbose mode
    if (configResult.loadedFrom) {
      logger.debug("Configuration loaded", { path: configResult.loadedFrom });
    } else {
      logger.debug("No configuration file found", {
        searchedPaths: configResult.searchedPaths,
      });
    }

    // Detect format from file extension
    const format = detectFormat(opts.input);
    if (!format) {
      throw new Error(`Unable to detect format from file: ${opts.input}`);
    }

    if (format !== "fit") {
      throw new Error(
        `Validation currently only supports FIT files. Got: ${format}`
      );
    }

    // Read input file
    logger?.debug("Reading input file", { path: opts.input, format });
    const inputData = await readFile(opts.input, format);

    if (typeof inputData === "string") {
      throw new Error("Expected binary data for FIT file");
    }

    // Load custom tolerance config if provided
    let toleranceConfig: ToleranceConfig | undefined;
    if (opts.toleranceConfig) {
      logger?.debug("Loading custom tolerance config", {
        path: opts.toleranceConfig,
      });
      const configContent = await fsReadFile(opts.toleranceConfig, "utf-8");
      const configJson = JSON.parse(configContent);
      toleranceConfig = toleranceConfigSchema.parse(configJson);
      logger?.debug("Custom tolerance config loaded", {
        config: toleranceConfig,
      });
    }

    // Get providers
    const providers = createDefaultProviders(
      {
        fit: createFitProviders(logger),
        garmin: createGarminProviders(logger),
        tcx: createTcxProviders(logger),
        zwo: createZwoProviders(logger),
      },
      logger
    );

    // Create tolerance checker with custom config if provided
    const toleranceChecker = toleranceConfig
      ? createToleranceChecker(toleranceConfig)
      : providers.toleranceChecker;

    // Create validateRoundTrip function with dependencies
    const roundTripValidator = validateRoundTrip(
      providers.fitReader!,
      providers.fitWriter!,
      toleranceChecker,
      logger
    );

    // Start spinner if not in quiet mode
    spinner =
      opts.quiet || opts.json
        ? null
        : ora("Validating round-trip conversion...").start();

    // Perform round-trip validation (FIT → KRD → FIT)
    logger?.info("Starting round-trip validation", { file: opts.input });
    const violations = await roundTripValidator.validateFitToKrdToFit({
      originalFit: inputData,
    });

    if (spinner) {
      if (violations.length === 0) {
        spinner.succeed("Validation complete - no tolerance violations");
      } else {
        spinner.fail(
          `Validation failed - ${violations.length} tolerance violation(s)`
        );
      }
    }

    // Handle validation results
    if (violations.length === 0) {
      logger?.info("Round-trip validation passed");

      if (opts.json) {
        console.log(
          JSON.stringify(
            {
              success: true,
              file: opts.input,
              format,
              violations: [],
            },
            null,
            2
          )
        );
      } else if (!opts.quiet) {
        console.log("Round-trip validation passed");
      }

      return ExitCode.SUCCESS;
    } else {
      // Violations found - format and display them
      logger?.warn("Round-trip validation failed", {
        violationCount: violations.length,
      });

      if (opts.json) {
        console.log(
          JSON.stringify(
            {
              success: false,
              file: opts.input,
              format,
              violations,
            },
            null,
            2
          )
        );
      } else {
        console.error("Round-trip validation failed\n");
        console.error(formatToleranceViolations(violations));
      }

      return ExitCode.TOLERANCE_EXCEEDED;
    }
  } catch (error) {
    logger?.error("Validation failed", { error });

    // Parse options for error formatting (may fail if error is in parsing)
    let jsonOutput = false;
    try {
      const opts = validateOptionsSchema.parse(options);
      jsonOutput = opts.json || false;
    } catch {
      // If options parsing failed, use default formatting
    }

    if (jsonOutput) {
      const errorObj = formatError(error, { json: true });
      // formatError with json:true returns a string, parse it back to object
      const errorData =
        typeof errorObj === "string" ? JSON.parse(errorObj) : errorObj;
      console.log(
        JSON.stringify(
          {
            success: false,
            error: errorData,
          },
          null,
          2
        )
      );
    } else {
      console.error(formatError(error, { json: false }));
    }

    // Determine appropriate exit code based on error type
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
    // Ensure spinner is stopped on all paths
    spinner?.stop();
  }
};
