/**
 * KRD validation error formatter
 */
import type { KrdValidationError } from "@kaiord/core";
import chalk from "chalk";
import { formatValidationErrors } from "../format-violations";

export const formatKrdValidationError = (
  error: KrdValidationError,
  useColors: boolean
): string => {
  const lines = [
    useColors
      ? chalk.red("\u2716 Error: Invalid KRD format")
      : "\u2716 Error: Invalid KRD format",
    "",
    formatValidationErrors(error.errors),
    "",
    useColors ? chalk.cyan("Suggestion:") : "Suggestion:",
    "  Check the KRD file against the schema.",
    "  Ensure all required fields are present and have valid values.",
  ];

  return lines.join("\n");
};
