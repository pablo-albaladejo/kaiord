import chalk from "chalk";
import type { ConversionResult } from "./types";

type BatchSummary = {
  total: number;
  successful: Array<ConversionResult>;
  failed: Array<ConversionResult>;
  totalTime: number;
};

/**
 * Print batch conversion results as pretty text
 */
export const printBatchSummary = (summary: BatchSummary): void => {
  const { total, successful, failed, totalTime } = summary;

  console.log("\nBatch conversion complete:");
  console.log(chalk.green(`  Successful: ${successful.length}/${total}`));
  if (failed.length > 0) {
    console.log(chalk.red(`  Failed: ${failed.length}/${total}`));
  }
  console.log(`  Total time: ${(totalTime / 1000).toFixed(2)}s`);

  if (failed.length > 0) {
    console.log(chalk.red("\nFailed conversions:"));
    for (const result of failed) {
      console.log(chalk.red(`  ${result.inputFile}: ${result.error}`));
    }
  }
};

/**
 * Print batch conversion results as JSON
 */
export const printBatchJson = (
  summary: BatchSummary,
  results: Array<ConversionResult>
): void => {
  const { total, successful, failed, totalTime } = summary;

  console.log(
    JSON.stringify(
      {
        success: failed.length === 0,
        total,
        successful: successful.length,
        failed: failed.length,
        totalTime,
        results,
      },
      null,
      2
    )
  );
};
