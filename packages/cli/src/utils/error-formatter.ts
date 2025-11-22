import type { ToleranceViolation, ValidationError } from "@kaiord/core";
import {
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";
import chalk from "chalk";
import { isTTY } from "./is-tty";

type FormatOptions = {
  json?: boolean;
};

/**
 * Check if colors should be used
 */
const shouldUseColors = (): boolean => {
  return isTTY() || process.env.FORCE_COLOR === "1";
};

/**
 * Format an error for display in terminal or JSON output
 */
export const formatError = (
  error: unknown,
  options: FormatOptions = {}
): string => {
  if (options.json) {
    return formatErrorAsJson(error);
  }
  return formatErrorAsPretty(error);
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
    const bullet = useColors ? chalk.red("•") : "•";
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
    const bullet = useColors ? chalk.red("•") : "•";
    const expected = violation.expected;
    const actual = violation.actual;
    const deviation = Math.abs(violation.deviation);
    const tolerance = violation.tolerance;

    lines.push(
      `  ${bullet} ${fieldPath}: expected ${expected}, got ${actual} ` +
        `(deviation: ${deviation}, tolerance: ±${tolerance})`
    );
  }

  return lines.join("\n");
};

/**
 * Format error as pretty terminal output with colors
 */
const formatErrorAsPretty = (error: unknown): string => {
  const useColors = shouldUseColors();

  // Handle FitParsingError
  if (error instanceof FitParsingError) {
    const lines = [
      useColors
        ? chalk.red("✖ Error: Failed to parse FIT file")
        : "✖ Error: Failed to parse FIT file",
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
  }

  // Handle KrdValidationError
  if (error instanceof KrdValidationError) {
    const lines = [
      useColors
        ? chalk.red("✖ Error: Invalid KRD format")
        : "✖ Error: Invalid KRD format",
      "",
      formatValidationErrors(error.errors),
    ];

    lines.push(
      "",
      useColors ? chalk.cyan("Suggestion:") : "Suggestion:",
      "  Check the KRD file against the schema.",
      "  Ensure all required fields are present and have valid values."
    );

    return lines.join("\n");
  }

  // Handle ToleranceExceededError
  if (error instanceof ToleranceExceededError) {
    const lines = [
      useColors
        ? chalk.red("✖ Error: Round-trip conversion failed")
        : "✖ Error: Round-trip conversion failed",
      "",
      formatToleranceViolations(error.violations),
    ];

    lines.push(
      "",
      useColors ? chalk.cyan("Suggestion:") : "Suggestion:",
      "  The conversion may have lost precision.",
      "  Consider adjusting tolerance values if the deviations are acceptable."
    );

    return lines.join("\n");
  }

  // Handle unknown errors
  if (error instanceof Error) {
    return [
      useColors
        ? chalk.red("✖ Error: An unexpected error occurred")
        : "✖ Error: An unexpected error occurred",
      "",
      useColors ? chalk.gray("Details:") : "Details:",
      `  ${error.message}`,
      "",
      ...(error.stack
        ? [
            useColors ? chalk.gray("Stack trace:") : "Stack trace:",
            `  ${error.stack}`,
          ]
        : []),
    ].join("\n");
  }

  // Handle non-Error objects
  return [
    useColors
      ? chalk.red("✖ Error: An unexpected error occurred")
      : "✖ Error: An unexpected error occurred",
    "",
    useColors ? chalk.gray("Details:") : "Details:",
    `  ${String(error)}`,
  ].join("\n");
};

/**
 * Format error as JSON output
 */
const formatErrorAsJson = (error: unknown): string => {
  // Handle FitParsingError
  if (error instanceof FitParsingError) {
    return JSON.stringify(
      {
        success: false,
        error: {
          type: "FitParsingError",
          message: error.message,
          cause: error.cause ? String(error.cause) : undefined,
          suggestion: "Verify the file is a valid FIT workout file.",
        },
      },
      null,
      2
    );
  }

  // Handle KrdValidationError
  if (error instanceof KrdValidationError) {
    return JSON.stringify(
      {
        success: false,
        error: {
          type: "KrdValidationError",
          message: error.message,
          errors: error.errors,
          suggestion: "Check the KRD file against the schema.",
        },
      },
      null,
      2
    );
  }

  // Handle ToleranceExceededError
  if (error instanceof ToleranceExceededError) {
    return JSON.stringify(
      {
        success: false,
        error: {
          type: "ToleranceExceededError",
          message: error.message,
          violations: error.violations,
          suggestion: "Consider adjusting tolerance values if acceptable.",
        },
      },
      null,
      2
    );
  }

  // Handle unknown errors
  if (error instanceof Error) {
    return JSON.stringify(
      {
        success: false,
        error: {
          type: error.name || "Error",
          message: error.message,
          stack: error.stack,
        },
      },
      null,
      2
    );
  }

  // Handle non-Error objects
  return JSON.stringify(
    {
      success: false,
      error: {
        type: "UnknownError",
        message: String(error),
      },
    },
    null,
    2
  );
};
