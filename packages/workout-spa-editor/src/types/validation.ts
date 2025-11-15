/**
 * Validation Helpers
 *
 * Real-time validation utilities for workout editing.
<<<<<<< HEAD
 *
 * This module re-exports validation utilities from focused submodules.
 */

// Re-export all validation utilities
export type { ValidationResult } from "./validation/validators";

export {
  validateField,
  validatePartialRepetitionBlock,
  validatePartialWorkoutStep,
  validateRepetitionBlock,
  validateWorkout,
  validateWorkoutMetadata,
  validateWorkoutStep,
} from "./validation/validators";

export {
  formatValidationErrors,
  formatZodError,
} from "./validation/formatters";

export {
  createDebouncedValidator,
  getFieldError,
  getNestedErrors,
  hasFieldError,
  mergeValidationErrors,
} from "./validation/helpers";
=======
 */

import type { ZodError, ZodSchema } from "zod";
import type { ValidationError } from "./krd";
import {
  partialRepetitionBlockSchema,
  partialWorkoutStepSchema,
  repetitionBlockSchema,
  workoutMetadataFormSchema,
  workoutSchema,
  workoutStepSchema,
} from "./schemas";

// ============================================
// Validation Result Types
// ============================================

export type ValidationResult<T> =
  | { success: true; data: T; errors: [] }
  | { success: false; data?: undefined; errors: Array<ValidationError> };

// ============================================
// Error Formatting
// ============================================

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

// ============================================
// Validation Functions
// ============================================

/**
 * Generic validation helper
 */
const validate = <T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: [],
    };
  }

  return {
    success: false,
    errors: formatZodError(result.error),
  };
};

/**
 * Validate a complete workout
 */
export const validateWorkout = (data: unknown): ValidationResult<unknown> => {
  return validate(workoutSchema, data);
};

/**
 * Validate a workout step
 */
export const validateWorkoutStep = (
  data: unknown
): ValidationResult<unknown> => {
  return validate(workoutStepSchema, data);
};

/**
 * Validate a partial workout step (for forms)
 */
export const validatePartialWorkoutStep = (
  data: unknown
): ValidationResult<unknown> => {
  return validate(partialWorkoutStepSchema, data);
};

/**
 * Validate a repetition block
 */
export const validateRepetitionBlock = (
  data: unknown
): ValidationResult<unknown> => {
  return validate(repetitionBlockSchema, data);
};

/**
 * Validate a partial repetition block (for forms)
 */
export const validatePartialRepetitionBlock = (
  data: unknown
): ValidationResult<unknown> => {
  return validate(partialRepetitionBlockSchema, data);
};

/**
 * Validate workout metadata form
 */
export const validateWorkoutMetadata = (
  data: unknown
): ValidationResult<unknown> => {
  return validate(workoutMetadataFormSchema, data);
};

// ============================================
// Real-time Validation Helpers
// ============================================

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

/**
 * Validate a single field
 */
export const validateField = <T>(
  schema: ZodSchema<T>,
  fieldName: string,
  value: unknown
): ValidationResult<T> => {
  try {
    const result = schema.safeParse(value);

    if (result.success) {
      return {
        success: true,
        data: result.data,
        errors: [],
      };
    }

    return {
      success: false,
      errors: formatZodError(result.error).map((err) => ({
        ...err,
        path: [fieldName, ...err.path],
      })),
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          path: [fieldName],
          message: error instanceof Error ? error.message : "Validation failed",
        },
      ],
    };
  }
};

// ============================================
// Validation State Management
// ============================================

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
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
