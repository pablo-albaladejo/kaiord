import { detectFormat } from "../../utils/format-detector";
import type { ValidatedConvertOptions } from "./types";

const buildInvalidArgumentError = (message: string): Error => {
  const error = new Error(message);
  error.name = "InvalidArgumentError";
  return error;
};

/**
 * Resolves and validates input/output formats for a single-file conversion.
 *
 * Throws InvalidArgumentError if formats cannot be detected or output is missing.
 */
export const resolveSingleFileFormats = (
  options: ValidatedConvertOptions
): { inputFormat: string; outputFormat: string; output: string } => {
  const inputFormat = options.inputFormat || detectFormat(options.input);

  if (!inputFormat) {
    throw buildInvalidArgumentError(
      `Unable to detect input format from file: ${options.input}. ` +
        `Supported formats: .fit, .gcn, .krd, .tcx, .zwo`
    );
  }

  if (!options.output) {
    throw buildInvalidArgumentError("Output file is required");
  }

  const outputFormat = options.outputFormat || detectFormat(options.output);

  if (!outputFormat) {
    throw buildInvalidArgumentError(
      `Unable to detect output format from file: ${options.output}. ` +
        `Supported formats: .fit, .gcn, .krd, .tcx, .zwo`
    );
  }

  return { inputFormat, outputFormat, output: options.output };
};
