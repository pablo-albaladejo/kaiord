/**
 * Pretty terminal error formatter with color support
 */
import {
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";
import chalk from "chalk";
import { getErrorTitle, getSuggestionForError } from "./error-suggestions";
import { formatToleranceViolations, formatValidationErrors } from "./format-violations";
import { isTTY } from "./is-tty";

const shouldUseColors = (): boolean => {
  return isTTY() || process.env.FORCE_COLOR === "1";
};

/**
 * Format error as pretty terminal output with colors
 */
export const formatErrorAsPretty = (error: unknown): string => {
  const useColors = shouldUseColors();

  if (error instanceof FitParsingError) {
    return formatFitParsingError(error, useColors);
  }

  if (error instanceof KrdValidationError) {
    return formatKrdValidationError(error, useColors);
  }

  if (error instanceof ToleranceExceededError) {
    return formatToleranceError(error, useColors);
  }

  if (error instanceof Error) {
    return formatGenericError(error, useColors);
  }

  return formatUnknownError(error, useColors);
};

const formatFitParsingError = (error: FitParsingError, useColors: boolean): string => {
  const lines = [
    useColors ? chalk.red("\u2716 Error: Failed to parse FIT file") : "\u2716 Error: Failed to parse FIT file",
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

const formatKrdValidationError = (error: KrdValidationError, useColors: boolean): string => {
  const lines = [
    useColors ? chalk.red("\u2716 Error: Invalid KRD format") : "\u2716 Error: Invalid KRD format",
    "",
    formatValidationErrors(error.errors),
    "",
    useColors ? chalk.cyan("Suggestion:") : "Suggestion:",
    "  Check the KRD file against the schema.",
    "  Ensure all required fields are present and have valid values.",
  ];

  return lines.join("\n");
};

const formatToleranceError = (error: ToleranceExceededError, useColors: boolean): string => {
  const lines = [
    useColors ? chalk.red("\u2716 Error: Round-trip conversion failed") : "\u2716 Error: Round-trip conversion failed",
    "",
    formatToleranceViolations(error.violations),
    "",
    useColors ? chalk.cyan("Suggestion:") : "Suggestion:",
    "  The conversion may have lost precision.",
    "  Consider adjusting tolerance values if the deviations are acceptable.",
  ];

  return lines.join("\n");
};

const formatGenericError = (error: Error, useColors: boolean): string => {
  const suggestion = getSuggestionForError(error);
  const lines = [
    useColors ? chalk.red(`\u2716 Error: ${getErrorTitle(error)}`) : `\u2716 Error: ${getErrorTitle(error)}`,
    "",
    useColors ? chalk.gray("Details:") : "Details:",
    `  ${error.message}`,
  ];

  if (suggestion) {
    lines.push("", useColors ? chalk.cyan("Suggestion:") : "Suggestion:", ...suggestion.map((s) => `  ${s}`));
  }

  return lines.join("\n");
};

const formatUnknownError = (error: unknown, useColors: boolean): string => {
  return [
    useColors ? chalk.red("\u2716 Error: An unexpected error occurred") : "\u2716 Error: An unexpected error occurred",
    "",
    useColors ? chalk.gray("Details:") : "Details:",
    `  ${String(error)}`,
  ].join("\n");
};
