/**
 * Error Formatting Utilities
 *
 * Format validation errors for display.
 */

import type { ZodError } from "zod";
import type { ValidationError } from "../krd";

/**
 * Format Zod errors into a user-friendly structure
 */
export const formatZodError = (error: ZodError): Array<ValidationError> => {
  return error.errors.map((err) => ({
    path: err.path,
    message: err.message,
    code: err.code,
  }));
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (
  errors: Array<ValidationError>
): string => {
  if (errors.length === 0) return "";

  return errors
    .map((err) => {
      const path = err.path.join(".");
      return path ? `${path}: ${err.message}` : err.message;
    })
    .join("\n");
};
