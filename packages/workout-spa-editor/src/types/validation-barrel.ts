/**
 * Validation Domain - Types Barrel
 *
 * Re-exports validation helpers (debounced runners, error formatters, field
 * accessors) and the canonical ValidationResult shape they produce.
 */

export type { ValidationResult } from "./validation";
export {
  createDebouncedValidator,
  formatValidationErrors,
  formatZodError,
  getFieldError,
  getNestedErrors,
  hasFieldError,
  mergeValidationErrors,
  validateField,
  validatePartialRepetitionBlock,
  validatePartialWorkoutStep,
  validateRepetitionBlock,
  validateWorkout,
  validateWorkoutMetadata,
  validateWorkoutStep,
} from "./validation";
