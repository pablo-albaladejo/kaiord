import chalk from "chalk";
import type { DiffResult } from "./types";

/**
 * Format diff result for pretty terminal output
 */
export const formatDiffPretty = (
  result: DiffResult,
  file1: string,
  file2: string
): string => {
  if (result.identical) {
    return chalk.green("Files are identical");
  }

  const lines: Array<string> = [];
  lines.push(chalk.yellow(`\nComparing: ${file1} vs ${file2}\n`));

  if (result.metadataDiff && result.metadataDiff.length > 0) {
    lines.push(chalk.bold("Metadata Differences:"));
    for (const diff of result.metadataDiff) {
      lines.push(
        `  ${chalk.cyan(diff.field)}:`,
        `    ${chalk.red("-")} ${JSON.stringify(diff.file1Value)}`,
        `    ${chalk.green("+")} ${JSON.stringify(diff.file2Value)}`
      );
    }
    lines.push("");
  }

  if (result.stepsDiff && result.stepsDiff.differences.length > 0) {
    lines.push(chalk.bold("Workout Steps Differences:"));
    lines.push(
      `  Step count: ${result.stepsDiff.file1Count} vs ${result.stepsDiff.file2Count}`
    );

    for (const diff of result.stepsDiff.differences) {
      lines.push(
        `  Step ${diff.stepIndex} - ${chalk.cyan(diff.field)}:`,
        `    ${chalk.red("-")} ${JSON.stringify(diff.file1Value)}`,
        `    ${chalk.green("+")} ${JSON.stringify(diff.file2Value)}`
      );
    }
    lines.push("");
  }

  if (result.extensionsDiff && result.extensionsDiff.differences.length > 0) {
    lines.push(chalk.bold("Extensions Differences:"));
    lines.push(
      `  Keys in file1: ${result.extensionsDiff.file1Keys.join(", ")}`,
      `  Keys in file2: ${result.extensionsDiff.file2Keys.join(", ")}`
    );

    for (const diff of result.extensionsDiff.differences) {
      lines.push(
        `  ${chalk.cyan(diff.key)}:`,
        `    ${chalk.red("-")} ${JSON.stringify(diff.file1Value)}`,
        `    ${chalk.green("+")} ${JSON.stringify(diff.file2Value)}`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
};
