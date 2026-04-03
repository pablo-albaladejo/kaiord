import ora from "ora";
import {
  loadConfigWithMetadata,
  mergeWithConfig,
} from "../../utils/config-loader.js";
import { ExitCode } from "../../utils/exit-codes.js";
import { loadFileAsKrd } from "../../utils/krd-converter.js";
import { createLogger } from "../../utils/logger-factory.js";
import { buildInspectSummary } from "./build-summary.js";
import { handleInspectError } from "./handle-error.js";
import { inspectOptionsSchema } from "./types.js";

export const inspectCommand = async (options: unknown): Promise<number> => {
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
      verbose: mergedOptions.verbose ?? config.verbose,
      quiet: mergedOptions.quiet ?? config.quiet,
      json: mergedOptions.json ?? config.json,
      logFormat: mergedOptions.logFormat || config.logFormat,
    };

    const opts = inspectOptionsSchema.parse(optionsWithDefaults);
    logger = await createLogger({
      type: opts.logFormat,
      level: opts.verbose ? "debug" : opts.quiet ? "error" : "info",
      quiet: opts.quiet,
    });

    spinner =
      opts.quiet || opts.json ? null : ora("Inspecting file...").start();

    const krd = await loadFileAsKrd(opts.input, opts.inputFormat, logger);

    spinner?.succeed("File loaded successfully");

    if (opts.json) {
      console.log(JSON.stringify(krd, null, 2));
    } else {
      console.log(buildInspectSummary(krd));
    }

    return ExitCode.SUCCESS;
  } catch (error) {
    spinner?.fail("Inspection failed");
    logger?.error("Inspect failed", { error });
    return handleInspectError(error, options);
  } finally {
    spinner?.stop();
  }
};
