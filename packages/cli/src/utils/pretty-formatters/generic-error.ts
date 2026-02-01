/**
 * Generic and unknown error formatters
 */
import chalk from "chalk";
import { getErrorTitle, getSuggestionForError } from "../error-suggestions";

export const formatGenericError = (
  error: Error,
  useColors: boolean
): string => {
  const suggestion = getSuggestionForError(error);
  const lines = [
    useColors
      ? chalk.red(`\u2716 Error: ${getErrorTitle(error)}`)
      : `\u2716 Error: ${getErrorTitle(error)}`,
    "",
    useColors ? chalk.gray("Details:") : "Details:",
    `  ${error.message}`,
  ];

  if (suggestion) {
    lines.push(
      "",
      useColors ? chalk.cyan("Suggestion:") : "Suggestion:",
      ...suggestion.map((s) => `  ${s}`)
    );
  }

  return lines.join("\n");
};

export const formatUnknownError = (
  error: unknown,
  useColors: boolean
): string => {
  return [
    useColors
      ? chalk.red("\u2716 Error: An unexpected error occurred")
      : "\u2716 Error: An unexpected error occurred",
    "",
    useColors ? chalk.gray("Details:") : "Details:",
    `  ${String(error)}`,
  ].join("\n");
};
