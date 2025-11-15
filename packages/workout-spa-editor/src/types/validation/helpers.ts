/**
 * Field-Level Validation Helpers
 *
 * Utilities for working with validation errors at the field level.
 */

import type { ValidationError } from "../krd";
import type { ValidationResult } from "./validators";

/**
 * Get error message for a specific field path
 */
export const getFieldError = (
  errors: Array<ValidationError>,
  fieldPath: Array<string | number>
): string | undefined => {
  const error = errors.find(
    (err) => JSON.stringify(err.path) === JSON.stringify(fieldPath)
  );
  return error?.message;
};

/**
 * Check if there are errors for a specific field
 */
export const hasFieldError = (
  errors: Array<ValidationError>,
  fieldPath: Array<string | number>
): boolean => {
  return errors.some(
    (err) => JSON.stringify(err.path) === JSON.stringify(fieldPath)
  );
};

/**
 * Get all errors for a specific parent path
 */
export const getNestedErrors = (
  errors: Array<ValidationError>,
  parentPath: Array<string | number>
): Array<ValidationError> => {
  return errors.filter((err) => {
    if (err.path.length <= parentPath.length) return false;

    return parentPath.every((segment, index) => err.path[index] === segment);
  });
};

/**
 * Merge validation errors from multiple sources
 */
export const mergeValidationErrors = (
  ...errorArrays: Array<Array<ValidationError>>
): Array<ValidationError> => {
  const merged = errorArrays.flat();

  // Remove duplicates based on path
  const unique = merged.filter(
    (error, index, self) =>
      index ===
      self.findIndex(
        (e) => JSON.stringify(e.path) === JSON.stringify(error.path)
      )
  );

  return unique;
};

/**
 * Debounced validation for real-time form feedback
 */
export const createDebouncedValidator = <T>(
  validator: (data: unknown) => ValidationResult<T>,
  delay = 300
) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (
    data: unknown,
    callback: (result: ValidationResult<T>) => void
  ): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      const result = validator(data);
      callback(result);
      timeoutId = null;
    }, delay);
  };
};
