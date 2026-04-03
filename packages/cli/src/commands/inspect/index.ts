import ora from "ora";
import { buildInspectSummary } from "./build-summary.js";
import { handleInspectError } from "./handle-error.js";
import { inspectOptionsSchema } from "./types.js";
import {
  loadConfigWithMetadata,
  mergeWithConfig,
} from "../../utils/config-loader.js";
import { ExitCode } from "../../utils/exit-codes.js";
import { loadFileAsKrd } from "../../utils/krd-converter.js";
import { createLogger } from "../../utils/logger-factory.js";
import type { InspectOptions } from "./types.js";

const getLogLevel = (opts: InspectOptions): "debug" | "error" | "info" => {
  if (opts.verbose) return "debug";
  if (opts.quiet) return "error";
  return "info";
};

const resolveOptions = async (options: unknown): Promise<InspectOptions> => {
  const configResult = await loadConfigWithMetadata();
  const { config } = configResult;
  const mergedOptions = mergeWithConfig(
    options as Record<string, unknown>,
    config
  );

  return inspectOptionsSchema.parse({
    ...mergedOptions,
    verbose: mergedOptions.verbose ?? config.verbose,
    quiet: mergedOptions.quiet ?? config.quiet,
    json: mergedOptions.json ?? config.json,
    logFormat: mergedOptions.logFormat || config.logFormat,
  });
};

export const inspectCommand = async (options: unknown): Promise<number> => {
  let logger: Awaited<ReturnType<typeof createLogger>> | undefined;
  let spinner: ReturnType<typeof ora> | null = null;

  try {
    const opts = await resolveOptions(options);
    logger = await createLogger({
      type: opts.logFormat,
      level: getLogLevel(opts),
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
