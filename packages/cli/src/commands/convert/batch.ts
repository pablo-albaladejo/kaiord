import type { Logger, Providers } from "@kaiord/core";
import chalk from "chalk";
import ora from "ora";
import { basename, join } from "path";
import { ExitCode } from "../../utils/exit-codes";
import { findFiles } from "../../utils/file-handler";
import { detectFormat } from "../../utils/format-detector";
import { convertSingleFile } from "./single-file";
import type { ConversionResult, ValidatedConvertOptions } from "./types";

/**
 * Execute batch file conversion mode
 */
export const executeBatchConversion = async (
  options: ValidatedConvertOptions,
  providers: Providers,
  logger: Logger
): Promise<number> => {
  if (!options.outputDir) {
    const error = new Error("Batch mode requires --output-dir flag");
    error.name = "InvalidArgumentError";
    throw error;
  }

  const outputFormat = options.outputFormat;
  if (!outputFormat) {
    const error = new Error(
      "Batch mode requires --output-format flag to specify target format"
    );
    error.name = "InvalidArgumentError";
    throw error;
  }

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
    const fileNum = index + 1;
    const fileName = basename(file);

    if (spinner) {
      spinner.text = `Converting ${fileNum}/${files.length}: ${fileName}`;
    } else {
      logger.info(`Converting ${fileNum}/${files.length}: ${fileName}`);
    }

    try {
      const inputFormat = options.inputFormat || detectFormat(file);

      if (!inputFormat) {
        throw new Error(`Unable to detect format for file: ${file}`);
      }

      const outputFileName = fileName.replace(
        /\.(fit|krd|tcx|zwo)$/i,
        `.${outputFormat}`
      );
      const outputFile = join(options.outputDir, outputFileName);

      await convertSingleFile(
        file,
        outputFile,
        inputFormat,
        outputFormat,
        providers
      );

      results.push({ success: true, inputFile: file, outputFile });
    } catch (error) {
      results.push({
        success: false,
        inputFile: file,
        error: error instanceof Error ? error.message : String(error),
      });
      logger.error(`Failed to convert ${file}`, { error });
    }
  }

  const totalTime = Date.now() - startTime;
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (spinner) {
    spinner.stop();
  }

  if (!options.json) {
    console.log("\nBatch conversion complete:");
    console.log(
      chalk.green(`  Successful: ${successful.length}/${files.length}`)
    );
    if (failed.length > 0) {
      console.log(chalk.red(`  Failed: ${failed.length}/${files.length}`));
    }
    console.log(`  Total time: ${(totalTime / 1000).toFixed(2)}s`);

    if (failed.length > 0) {
      console.log(chalk.red("\nFailed conversions:"));
      for (const result of failed) {
        console.log(chalk.red(`  ${result.inputFile}: ${result.error}`));
      }
    }
  } else {
    console.log(
      JSON.stringify(
        {
          success: failed.length === 0,
          total: files.length,
          successful: successful.length,
          failed: failed.length,
          totalTime,
          results,
        },
        null,
        2
      )
    );
  }

  if (failed.length === 0) {
    return ExitCode.SUCCESS;
  }
  // All files failed
  if (successful.length === 0) {
    return ExitCode.INVALID_ARGUMENT;
  }
  // Partial success - some succeeded, some failed
  return ExitCode.PARTIAL_SUCCESS;
};
