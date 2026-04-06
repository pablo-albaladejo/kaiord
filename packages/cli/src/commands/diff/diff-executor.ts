import type { Logger } from "@kaiord/core";
import { loadFileAsKrd } from "../../utils/krd-converter.js";
import {
  compareExtensions,
  compareMetadata,
  compareSteps,
} from "./comparators";
import { formatDiffPretty } from "./formatter";
import type { DiffResult, ValidatedDiffOptions } from "./types";

/**
 * Load files and compute their differences
 */
export const computeDiff = async (
  options: ValidatedDiffOptions,
  logger: Logger
): Promise<DiffResult> => {
  logger.debug("Loading files for comparison", {
    file1: options.file1,
    file2: options.file2,
  });

  const krd1 = await loadFileAsKrd(options.file1, options.format1, logger);
  const krd2 = await loadFileAsKrd(options.file2, options.format2, logger);

  logger.debug("Files loaded successfully");

  const metadataDiff = compareMetadata(krd1, krd2);
  const stepsDiff = compareSteps(krd1, krd2);
  const extensionsDiff = compareExtensions(krd1, krd2);

  const identical =
    metadataDiff.length === 0 &&
    stepsDiff.differences.length === 0 &&
    extensionsDiff.differences.length === 0;

  return {
    identical,
    metadataDiff: metadataDiff.length > 0 ? metadataDiff : undefined,
    stepsDiff: stepsDiff.differences.length > 0 ? stepsDiff : undefined,
    extensionsDiff:
      extensionsDiff.differences.length > 0 ? extensionsDiff : undefined,
  };
};

/**
 * Format and print diff results to the console
 */
export const printDiffResult = (
  result: DiffResult,
  options: ValidatedDiffOptions
): void => {
  if (options.json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          file1: options.file1,
          file2: options.file2,
          ...result,
        },
        null,
        2
      )
    );
  } else {
    console.log(formatDiffPretty(result, options.file1, options.file2));
  }
};
