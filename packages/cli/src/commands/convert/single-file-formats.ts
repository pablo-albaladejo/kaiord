import { UnsupportedFormatError } from "../../utils/cli-errors";
import { detectFormat } from "../../utils/format-detector";
import { SUPPORTED_EXTENSIONS } from "../../utils/format-registry";
import type { ValidatedConvertOptions } from "./types";

/**
 * Resolves and validates input/output formats for a single-file conversion.
 *
 * Throws on undetectable formats (UnsupportedFormatError) or missing output
 * (InvalidArgumentError).
 */
export const resolveSingleFileFormats = (
  options: ValidatedConvertOptions
): { inputFormat: string; outputFormat: string; output: string } => {
  const inputFormat = options.inputFormat || detectFormat(options.input);

  if (!inputFormat) {
    throw new UnsupportedFormatError(
      `Unable to detect input format from file: ${options.input}. ` +
        `Supported formats: ${SUPPORTED_EXTENSIONS}`
    );
  }

  if (!options.output) {
    const error = new Error("Output file is required");
    error.name = "InvalidArgumentError";
    throw error;
  }

  const outputFormat = options.outputFormat || detectFormat(options.output);

  if (!outputFormat) {
    throw new UnsupportedFormatError(
      `Unable to detect output format from file: ${options.output}. ` +
        `Supported formats: ${SUPPORTED_EXTENSIONS}`
    );
  }

  return { inputFormat, outputFormat, output: options.output };
};
