import type { Logger } from "@kaiord/core";
import ora from "ora";
import { writeFile } from "../../utils/file-handler";
import { detectFormat, type FileFormat } from "../../utils/format-detector";
import { convertFromKrd, loadFileAsKrd } from "../../utils/krd-converter";
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
  const inputFormat = options.inputFormat || detectFormat(options.input);

  if (!inputFormat) {
    const error = new Error(
      `Unable to detect input format from file: ${options.input}. ` +
        `Supported formats: .fit, .gcn, .krd, .tcx, .zwo`
    );
    error.name = "InvalidArgumentError";
    throw error;
  }

  if (!options.output) {
    const error = new Error("Output file is required");
    error.name = "InvalidArgumentError";
    throw error;
  }

  const outputFormat = options.outputFormat || detectFormat(options.output);

  if (!outputFormat) {
    const error = new Error(
      `Unable to detect output format from file: ${options.output}. ` +
        `Supported formats: .fit, .gcn, .krd, .tcx, .zwo`
    );
    error.name = "InvalidArgumentError";
    throw error;
  }

  logger.debug("Convert command initialized", {
    input: options.input,
    output: options.output,
    inputFormat,
    outputFormat,
  });

  const isTTY = process.stdout.isTTY && !options.quiet && !options.json;
  const spinner = isTTY ? ora("Converting...").start() : null;

  try {
    await convertSingleFile(
      options.input,
      options.output,
      inputFormat,
      outputFormat,
      logger
    );

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            success: true,
            inputFile: options.input,
            outputFile: options.output,
            inputFormat,
            outputFormat,
          },
          null,
          2
        )
      );
    } else if (spinner) {
      spinner.succeed(
        `Conversion complete: ${options.input} -> ${options.output}`
      );
    } else {
      logger.info("Conversion complete", {
        input: options.input,
        output: options.output,
      });
    }
  } catch (error) {
    if (spinner) {
      spinner.fail("Conversion failed");
    }
    throw error;
  }
};
