import {
  partialRepetitionBlockSchema,
  partialWorkoutStepSchema,
  repetitionBlockSchema,
  workoutMetadataFormSchema,
  workoutSchema,
  workoutStepSchema,
} from "../schemas";
import { formatZodError } from "./formatters";
import { validate } from "./validate-helper";
import type { ValidationResult } from "./validation-types";
import type { ZodType } from "zod";

export type { ValidationResult } from "./validation-types";

// ============================================
// Validation Functions
// ============================================

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

/**
 * Validate a single field
 */
export const validateField = <T>(
  schema: ZodType<T>,
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
