/**
 * Error formatting facade - delegates to JSON or pretty formatters
 */
import { formatErrorAsJson } from "./error-formatter-json";
import { formatErrorAsPretty } from "./error-formatter-pretty";

// Re-export violation formatters for backwards compatibility
export {
  formatValidationErrors,
  formatToleranceViolations,
} from "./format-violations";

type FormatOptions = {
  json?: boolean;
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
