/**
 * Pretty terminal error formatter with color support
 */
import {
  FitParsingError,
  KrdValidationError,
  ToleranceExceededError,
} from "@kaiord/core";
import { isTTY } from "./is-tty";
import {
  formatFitParsingError,
  formatGenericError,
  formatKrdValidationError,
  formatToleranceError,
  formatUnknownError,
} from "./pretty-formatters";

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
