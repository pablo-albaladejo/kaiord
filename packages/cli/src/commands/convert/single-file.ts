import type { Logger } from "@kaiord/core";
import ora from "ora";
import { writeFile } from "../../utils/file-handler";
import type { FileFormat } from "../../utils/format-detector";
import { convertFromKrd, loadFileAsKrd } from "../../utils/krd-converter";
import { resolveSingleFileFormats } from "./single-file-formats";
import { reportConversionSuccess } from "./single-file-reporter";
import type { ValidatedConvertOptions } from "./types";

/**
 * Convert a single file from one format to another
 */
export const convertSingleFile = async (
  inputFile: string,
  outputFile: string,
  inputFormat: string,
  outputFormat: string,
  logger: Logger
): Promise<void> => {
  const krd = await loadFileAsKrd(inputFile, inputFormat, logger);
  const outputData = await convertFromKrd(krd, outputFormat, logger);
  await writeFile(outputFile, outputData, outputFormat as FileFormat);
};

/**
 * Execute single file conversion mode
 */
export const executeSingleFileConversion = async (
  options: ValidatedConvertOptions,
  logger: Logger
): Promise<void> => {
  const { inputFormat, outputFormat, output } =
    resolveSingleFileFormats(options);

  logger.debug("Convert command initialized", {
    input: options.input,
    output,
    inputFormat,
    outputFormat,
  });

  const isTTY = process.stdout.isTTY && !options.quiet && !options.json;
  const spinner = isTTY ? ora("Converting...").start() : null;

  try {
    await convertSingleFile(
      options.input,
      output,
      inputFormat,
      outputFormat,
      logger
    );

    reportConversionSuccess({
      input: options.input,
      output,
      inputFormat,
      outputFormat,
      json: options.json,
      spinner,
      logger,
    });
  } catch (error) {
    if (spinner) {
      spinner.fail("Conversion failed");
    }
    throw error;
  }
};
