import type { Logger } from "@kaiord/core";
import ora from "ora";
import { basename } from "path";
import { ExitCode } from "../../utils/exit-codes";
import { findFiles } from "../../utils/file-handler";
import { convertBatchFile, validateBatchOptions } from "./batch-helpers";
import { printBatchJson, printBatchSummary } from "./batch-output";
import type { ConversionResult, ValidatedConvertOptions } from "./types";

/**
 * Execute batch file conversion mode
 */
export const executeBatchConversion = async (
  options: ValidatedConvertOptions,
  logger: Logger
): Promise<number> => {
  const outputFormat = validateBatchOptions(options);
  const startTime = Date.now();
  const files = await findFiles(options.input);

  if (files.length === 0) {
    const error = new Error(
      `No files found matching pattern: ${options.input}`
    );
    error.name = "InvalidArgumentError";
    throw error;
  }

  logger.debug("Batch conversion started", {
    pattern: options.input,
    fileCount: files.length,
    outputDir: options.outputDir,
    outputFormat,
  });

  const isTTY = process.stdout.isTTY && !options.quiet && !options.json;
  const spinner = isTTY ? ora("Processing batch conversion...").start() : null;
  const results: Array<ConversionResult> = [];

  for (const [index, file] of files.entries()) {
    if (spinner) {
      spinner.text = `Converting ${index + 1}/${files.length}: ${basename(file)}`;
    } else {
      logger.info(`Converting ${index + 1}/${files.length}: ${basename(file)}`);
    }
    results.push(await convertBatchFile(file, options, outputFormat, logger));
  }

  if (spinner) spinner.stop();

  const totalTime = Date.now() - startTime;
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const summary = { total: files.length, successful, failed, totalTime };

  if (options.json) printBatchJson(summary, results);
  else printBatchSummary(summary);

  if (failed.length === 0) return ExitCode.SUCCESS;
  if (successful.length === 0) return ExitCode.INVALID_ARGUMENT;
  return ExitCode.PARTIAL_SUCCESS;
};
