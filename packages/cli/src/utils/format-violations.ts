/**
 * Format validation errors and tolerance violations for CLI output
 */
import type { ToleranceViolation, ValidationError } from "@kaiord/core";
import chalk from "chalk";
import { isTTY } from "./is-tty";

const shouldUseColors = (): boolean => {
  return isTTY() || process.env.FORCE_COLOR === "1";
};

/**
 * Format validation errors with field paths
 */
export const formatValidationErrors = (
  errors: Array<ValidationError>
): string => {
  if (errors.length === 0) {
    return "";
  }

  const useColors = shouldUseColors();
  const lines = [
    useColors ? chalk.red("Validation errors:") : "Validation errors:",
  ];

  for (const error of errors) {
    const fieldPath = useColors ? chalk.yellow(error.field) : error.field;
    const bullet = useColors ? chalk.red("\u2022") : "\u2022";
    lines.push(`  ${bullet} ${fieldPath}: ${error.message}`);
  }

  return lines.join("\n");
};

/**
 * Format tolerance violations with expected/actual values
 */
export const formatToleranceViolations = (
  violations: Array<ToleranceViolation>
): string => {
  if (violations.length === 0) {
    return "";
  }

  const useColors = shouldUseColors();
  const lines = [
    useColors ? chalk.red("Tolerance violations:") : "Tolerance violations:",
  ];

  for (const violation of violations) {
    const fieldPath = useColors
      ? chalk.yellow(violation.field)
      : violation.field;
    const bullet = useColors ? chalk.red("\u2022") : "\u2022";
    const { expected, actual, tolerance } = violation;
    const deviation = Math.abs(violation.deviation);

    lines.push(
      `  ${bullet} ${fieldPath}: expected ${expected}, got ${actual} ` +
        `(deviation: ${deviation}, tolerance: \u00B1${tolerance})`
    );
  }

  return lines.join("\n");
};
