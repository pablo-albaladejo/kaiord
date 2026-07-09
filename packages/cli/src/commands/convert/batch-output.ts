import chalk from "chalk";

import { t } from "../../i18n/index.js";
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

  console.log(t("output.batchComplete"));
  console.log(
    chalk.green(
      t("output.batchSuccessful", { count: successful.length, total })
    )
  );
  if (failed.length > 0) {
    console.log(
      chalk.red(t("output.batchFailed", { count: failed.length, total }))
    );
  }
  console.log(
    t("output.batchTotalTime", { seconds: (totalTime / 1000).toFixed(2) })
  );

  if (failed.length > 0) {
    console.log(chalk.red(t("output.batchFailedHeading")));
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
