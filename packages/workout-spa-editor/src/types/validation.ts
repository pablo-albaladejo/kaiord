/**
 * Validation Helpers
 *
 * Real-time validation utilities for workout editing.
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
