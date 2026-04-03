import { extractWorkout } from "@kaiord/core";
import ora from "ora";
import { handleExtractWorkoutError } from "./handle-error.js";
import { extractWorkoutOptionsSchema } from "./types.js";
import {
  loadConfigWithMetadata,
  mergeWithConfig,
} from "../../utils/config-loader.js";
import { ExitCode } from "../../utils/exit-codes.js";
import { loadFileAsKrd } from "../../utils/krd-converter.js";
import { createLogger } from "../../utils/logger-factory.js";
import type { ExtractWorkoutOptions } from "./types.js";

const resolveOptions = async (
  options: unknown
): Promise<ExtractWorkoutOptions> => {
  const configResult = await loadConfigWithMetadata();
  const { config } = configResult;
  const mergedOptions = mergeWithConfig(
    options as Record<string, unknown>,
    config
  );

  return extractWorkoutOptionsSchema.parse({
    ...mergedOptions,
    verbose: mergedOptions.verbose ?? config.verbose,
    quiet: mergedOptions.quiet ?? config.quiet,
    logFormat: mergedOptions.logFormat || config.logFormat,
  });
};

export const extractWorkoutCommand = async (
  options: unknown
): Promise<number> => {
  let logger: Awaited<ReturnType<typeof createLogger>> | undefined;
  let spinner: ReturnType<typeof ora> | null = null;

  try {
    const opts = await resolveOptions(options);
    logger = await createLogger({
      type: opts.logFormat,
      level: opts.verbose ? "debug" : opts.quiet ? "error" : "info",
      quiet: opts.quiet,
    });

    spinner = opts.quiet ? null : ora("Extracting workout...").start();

    const krd = await loadFileAsKrd(opts.input, opts.inputFormat, logger);
    const workout = extractWorkout(krd);

    spinner?.succeed("Workout extracted successfully");
    console.log(JSON.stringify(workout, null, 2));

    return ExitCode.SUCCESS;
  } catch (error) {
    spinner?.fail("Extraction failed");
    logger?.error("Extract workout failed", { error });
    return handleExtractWorkoutError(error);
  } finally {
    spinner?.stop();
  }
};
