/**
 * Validation error details for a specific field.
 *
 * Used by {@link KrdValidationError} to provide detailed information about validation failures.
 *
 * @example
 * ```typescript
 * const error: ValidationError = {
 *   field: 'version',
 *   message: 'Required field missing',
 *   expected: 'string',
 *   actual: undefined
 * };
 * ```
 */
export type ValidationError = {
  /** The field path that failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
  /** Optional expected value or type */
  expected?: unknown;
  /** Optional actual value that failed validation */
  actual?: unknown;
};

/**
 * Tolerance violation details for a specific field.
 *
 * Used by {@link ToleranceExceededError} to provide detailed information about round-trip conversion errors.
 *
 * @example
 * ```typescript
 * const violation: ToleranceViolation = {
 *   field: 'power',
 *   expected: 250,
 *   actual: 252,
 *   deviation: 2,
 *   tolerance: 1
 * };
 * ```
 */
export type ToleranceViolation = {
  /** The field that exceeded tolerance */
  field: string;
  /** Expected value from original data */
  expected: number;
  /** Actual value after round-trip conversion */
  actual: number;
  /** Absolute deviation from expected value */
  deviation: number;
  /** Maximum allowed tolerance */
  tolerance: number;
};
