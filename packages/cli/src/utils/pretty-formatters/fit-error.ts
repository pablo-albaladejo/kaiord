/**
 * FIT parsing error formatter
 */
import type { FitParsingError } from "@kaiord/core";
import chalk from "chalk";

export const formatFitParsingError = (
  error: FitParsingError,
  useColors: boolean
): string => {
  const lines = [
    useColors
      ? chalk.red("\u2716 Error: Failed to parse FIT file")
      : "\u2716 Error: Failed to parse FIT file",
    "",
    useColors ? chalk.gray("Details:") : "Details:",
    `  ${error.message}`,
  ];

  if (error.cause) {
    lines.push("", useColors ? chalk.gray("Cause:") : "Cause:");
    lines.push(`  ${String(error.cause)}`);
  }

  lines.push(
    "",
    useColors ? chalk.cyan("Suggestion:") : "Suggestion:",
    "  Verify the file is a valid FIT workout file.",
    "  Try opening it in Garmin Connect to confirm."
  );

  return lines.join("\n");
};
