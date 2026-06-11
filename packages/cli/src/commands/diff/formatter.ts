import chalk from "chalk";

import type { DiffResult } from "./types";

type MetadataDiff = NonNullable<DiffResult["metadataDiff"]>[number];
type StepsDiff = NonNullable<DiffResult["stepsDiff"]>;
type ExtensionsDiff = NonNullable<DiffResult["extensionsDiff"]>;

const renderMetadataSection = (diffs: Array<MetadataDiff>): Array<string> => {
  const lines: Array<string> = [chalk.bold("Metadata Differences:")];
  for (const diff of diffs) {
    lines.push(
      `  ${chalk.cyan(diff.field)}:`,
      `    ${chalk.red("-")} ${JSON.stringify(diff.file1Value)}`,
      `    ${chalk.green("+")} ${JSON.stringify(diff.file2Value)}`
    );
  }
  lines.push("");
  return lines;
};

const renderStepsSection = (stepsDiff: StepsDiff): Array<string> => {
  const lines: Array<string> = [
    chalk.bold("Workout Steps Differences:"),
    `  Step count: ${stepsDiff.file1Count} vs ${stepsDiff.file2Count}`,
  ];
  for (const diff of stepsDiff.differences) {
    lines.push(
      `  Step ${diff.stepIndex} - ${chalk.cyan(diff.field)}:`,
      `    ${chalk.red("-")} ${JSON.stringify(diff.file1Value)}`,
      `    ${chalk.green("+")} ${JSON.stringify(diff.file2Value)}`
    );
  }
  lines.push("");
  return lines;
};

const renderExtensionsSection = (extDiff: ExtensionsDiff): Array<string> => {
  const lines: Array<string> = [
    chalk.bold("Extensions Differences:"),
    `  Keys in file1: ${extDiff.file1Keys.join(", ")}`,
    `  Keys in file2: ${extDiff.file2Keys.join(", ")}`,
  ];
  for (const diff of extDiff.differences) {
    lines.push(
      `  ${chalk.cyan(diff.key)}:`,
      `    ${chalk.red("-")} ${JSON.stringify(diff.file1Value)}`,
      `    ${chalk.green("+")} ${JSON.stringify(diff.file2Value)}`
    );
  }
  lines.push("");
  return lines;
};

export const formatDiffPretty = (
  result: DiffResult,
  file1: string,
  file2: string
): string => {
  if (result.identical) {
    return chalk.green("Files are identical");
  }

  const lines: Array<string> = [
    chalk.yellow(`\nComparing: ${file1} vs ${file2}\n`),
  ];

  if (result.metadataDiff && result.metadataDiff.length > 0) {
    lines.push(...renderMetadataSection(result.metadataDiff));
  }
  if (result.stepsDiff && result.stepsDiff.differences.length > 0) {
    lines.push(...renderStepsSection(result.stepsDiff));
  }
  if (result.extensionsDiff && result.extensionsDiff.differences.length > 0) {
    lines.push(...renderExtensionsSection(result.extensionsDiff));
  }

  return lines.join("\n");
};
