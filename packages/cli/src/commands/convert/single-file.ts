import type { Logger } from "@kaiord/core";
import ora from "ora";

import { t } from "../../i18n/index.js";
import { writeFile } from "../../utils/file-handler";
import type { FileFormat } from "../../utils/format-detector";
import { convertFromKrd, loadFileAsKrd } from "../../utils/krd-converter";
import { resolveSingleFileFormats } from "./single-file-formats";
import { reportConversionSuccess } from "./single-file-reporter";
import type { ValidatedConvertOptions } from "./types";

type ConversionParams = {
  inputFile: string;
  outputFile: string;
  inputFormat: string;
  outputFormat: string;
};

export const convertSingleFile = async (
  params: ConversionParams,
  logger: Logger
): Promise<void> => {
  const krd = await loadFileAsKrd(params.inputFile, params.inputFormat, logger);
  const outputData = await convertFromKrd(krd, params.outputFormat, logger);
  await writeFile(
    params.outputFile,
    outputData,
    params.outputFormat as FileFormat
  );
};

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
  const spinner = isTTY ? ora(t("output.converting")).start() : null;

  try {
    await convertSingleFile(
      {
        inputFile: options.input,
        outputFile: output,
        inputFormat,
        outputFormat,
      },
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
