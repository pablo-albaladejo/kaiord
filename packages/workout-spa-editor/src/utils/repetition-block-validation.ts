/**
 * Repetition Block Validation Utilities
 *
 * Validation functions for repetition block creation and editing.
 * Ensures minimum requirements are met before creating or modifying blocks.
 */

/**
 * Validation error types for repetition block operations
 */
export type RepetitionBlockValidationError = {
  type: "MIN_STEPS" | "MIN_REPEAT_COUNT";
  message: string;
};

/**
 * Validates repetition block creation parameters
 *
 * Checks that:
 * - At least 2 steps are selected
 * - Repeat count is at least 2
 *
 * @param selectedStepIds - Array of selected step IDs
 * @param repeatCount - Number of times to repeat the block
 * @returns Validation error if validation fails, null if validation passes
 *
 * @example
 * ```typescript
 * const error = validateRepetitionBlockCreation(['step-0', 'step-1'], 3);
 * if (error) {
 *   console.error(error.message);
 * }
 * ```
 */
export const validateRepetitionBlockCreation = (
  selectedStepIds: Array<string>,
  repeatCount: number
): RepetitionBlockValidationError | null => {
  // Validate minimum steps (check this first)
  if (selectedStepIds.length < 2) {
    return {
      type: "MIN_STEPS",
      message: "Select at least 2 steps to create a repetition block",
    };
  }

  // Validate minimum repeat count
  if (repeatCount < 2) {
    return {
      type: "MIN_REPEAT_COUNT",
      message: "Repeat count must be at least 2",
    };
  }

  // All validations passed
  return null;
};
