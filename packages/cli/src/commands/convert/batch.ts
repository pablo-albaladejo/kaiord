import type { Logger } from "@kaiord/core";
import ora from "ora";
import { basename } from "path";

import { ExitCode } from "../../utils/exit-codes";
import { findFiles } from "../../utils/file-handler";
import { convertBatchFile, validateBatchOptions } from "./batch-helpers";
import { printBatchJson, printBatchSummary } from "./batch-output";
import type { ConversionResult, ValidatedConvertOptions } from "./types";

type Spinner = ReturnType<typeof ora> | null;

type BatchSummary = {
  total: number;
  successful: Array<ConversionResult>;
  failed: Array<ConversionResult>;
  totalTime: number;
};

type ProgressContext = { index: number; total: number; file: string };

const reportProgress = (
  spinner: Spinner,
  logger: Logger,
  ctx: ProgressContext
): void => {
  const label = `Converting ${ctx.index + 1}/${ctx.total}: ${basename(ctx.file)}`;
  if (spinner) {
    spinner.text = label;
  } else {
    logger.info(label);
  }
};

const printResults = (
  options: ValidatedConvertOptions,
  summary: BatchSummary,
  results: Array<ConversionResult>
): void => {
  if (options.json) printBatchJson(summary, results);
  else printBatchSummary(summary);
};

const resolveExitCode = (summary: BatchSummary): number => {
  if (summary.failed.length === 0) return ExitCode.SUCCESS;
  if (summary.successful.length === 0) return ExitCode.INVALID_ARGUMENT;
  return ExitCode.PARTIAL_SUCCESS;
};

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
    reportProgress(spinner, logger, { index, total: files.length, file });
    results.push(await convertBatchFile(file, options, outputFormat, logger));
  }

  if (spinner) spinner.stop();

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const summary: BatchSummary = {
    total: files.length,
    successful,
    failed,
    totalTime: Date.now() - startTime,
  };

  printResults(options, summary, results);
  return resolveExitCode(summary);
};
