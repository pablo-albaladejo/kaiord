/**
 * Tolerance exceeded error formatter
 */
import type { ToleranceExceededError } from "@kaiord/core";
import chalk from "chalk";
import { formatToleranceViolations } from "../format-violations";

export const formatToleranceError = (
  error: ToleranceExceededError,
  useColors: boolean
): string => {
  const lines = [
    useColors
      ? chalk.red("\u2716 Error: Round-trip conversion failed")
      : "\u2716 Error: Round-trip conversion failed",
    "",
    formatToleranceViolations(error.violations),
    "",
    useColors ? chalk.cyan("Suggestion:") : "Suggestion:",
    "  The conversion may have lost precision.",
    "  Consider adjusting tolerance values if the deviations are acceptable.",
  ];

  return lines.join("\n");
};
