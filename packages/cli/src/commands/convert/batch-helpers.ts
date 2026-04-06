import type { Logger } from "@kaiord/core";
import { basename, join } from "path";
import { detectFormat } from "../../utils/format-detector";
import { convertSingleFile } from "./single-file";
import type { ConversionResult, ValidatedConvertOptions } from "./types";

/**
 * Create an InvalidArgumentError with the given message
 */
const invalidArgError = (message: string): Error => {
  const error = new Error(message);
  error.name = "InvalidArgumentError";
  return error;
};

/**
 * Validate batch mode prerequisites and return the output format
 */
export const validateBatchOptions = (
  options: ValidatedConvertOptions
): string => {
  if (!options.outputDir) {
    throw invalidArgError("Batch mode requires --output-dir flag");
  }
  if (!options.outputFormat) {
    throw invalidArgError(
      "Batch mode requires --output-format flag to specify target format"
    );
  }
  return options.outputFormat;
};

/**
 * Convert a single file within a batch, returning the result
 */
export const convertBatchFile = async (
  file: string,
  options: ValidatedConvertOptions,
  outputFormat: string,
  logger: Logger
): Promise<ConversionResult> => {
  try {
    const inputFormat = options.inputFormat || detectFormat(file);
    if (!inputFormat) throw new Error(`Unable to detect format: ${file}`);

    const fileName = basename(file);
    const outputFileName = fileName.replace(
      /\.(fit|krd|tcx|zwo)$/i,
      `.${outputFormat}`
    );
    const outputFile = join(options.outputDir!, outputFileName);

    await convertSingleFile(
      file,
      outputFile,
      inputFormat,
      outputFormat,
      logger
    );
    return { success: true, inputFile: file, outputFile };
  } catch (error) {
    logger.error(`Failed to convert ${file}`, { error });
    return {
      success: false,
      inputFile: file,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
