/**
 * Test fixtures for helpers.test.ts (validation helpers)
 *
 * Domain-named numeric constants used to replace magic numbers
 * in field-level validation helper tests.
 */

// Step indices (0-based)
export const STEP_INDEX_FIRST = 0;
export const STEP_INDEX_SECOND = 1;

// Expected merged-error array sizes
export const MERGED_ERRORS_TWO = 2;
export const MERGED_ERRORS_ONE = 1;
export const MERGED_ERRORS_THREE = 3;

// Nested-error result counts
export const NESTED_RESULT_TWO = 2;
export const NESTED_RESULT_ONE = 1;
export const NESTED_RESULT_NONE = 0;

// Debounce delays (milliseconds)
export const DEBOUNCE_DELAY_SHORT_MS = 100;
export const DEBOUNCE_DELAY_MEDIUM_MS = 50;
export const DEBOUNCE_WAIT_AFTER_SHORT_MS = 150;
export const DEBOUNCE_WAIT_AFTER_MEDIUM_MS = 100;
export const DEBOUNCE_DEFAULT_PRE_DELAY_MS = 200;
export const DEBOUNCE_DEFAULT_POST_DELAY_MS = 150;
export const DEBOUNCE_BETWEEN_CALLS_MS = 50;

// Debounce expected call counts
export const DEBOUNCE_VALIDATOR_CALLS_ONCE = 1;
export const DEBOUNCE_CALLBACK_CALLS_ONCE = 1;

// Sentinel debounce input values (distinguish successive calls)
export const DEBOUNCE_INPUT_VALUE_FIRST = 1;
export const DEBOUNCE_INPUT_VALUE_SECOND = 2;
export const DEBOUNCE_INPUT_VALUE_THIRD = 3;
