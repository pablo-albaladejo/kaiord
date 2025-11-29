import type { ToleranceViolation } from "./error-types";

/**
 * Error thrown when round-trip conversion exceeds tolerance thresholds.
 *
 * This error is thrown by the tolerance checker when converting between formats
 * results in data loss or precision errors beyond acceptable tolerances.
 *
 * @example
 * ```typescript
 * import { ToleranceExceededError, validateRoundTrip } from '@kaiord/core';
 *
 * try {
 *   await validateRoundTrip(checker, fitReader, fitWriter, logger)({
 *     krd: originalKrd
 *   });
 * } catch (error) {
 *   if (error instanceof ToleranceExceededError) {
 *     console.error('Round-trip tolerance exceeded:', error.message);
 *     error.violations.forEach(v => {
 *       console.error(`  ${v.field}: expected ${v.expected}, got ${v.actual}`);
 *       console.error(`    deviation: ${v.deviation}, tolerance: ${v.tolerance}`);
 *     });
 *   }
 * }
 * ```
 */
export class ToleranceExceededError extends Error {
  public override readonly name = "ToleranceExceededError";

  constructor(
    message: string,
    public readonly violations: Array<ToleranceViolation>
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ToleranceExceededError);
    }
  }
}

/**
 * Factory function to create a ToleranceExceededError.
 *
 * Provides a functional programming style alternative to using `new ToleranceExceededError()`.
 *
 * @param message - Error message describing the tolerance violation
 * @param violations - Array of tolerance violations with field-level details
 * @returns A new ToleranceExceededError instance
 *
 * @example
 * ```typescript
 * import { createToleranceExceededError } from '@kaiord/core';
 *
 * throw createToleranceExceededError('Round-trip conversion exceeded tolerance', [
 *   {
 *     field: 'power',
 *     expected: 250,
 *     actual: 252,
 *     deviation: 2,
 *     tolerance: 1
 *   }
 * ]);
 * ```
 */
export const createToleranceExceededError = (
  message: string,
  violations: Array<ToleranceViolation>
): ToleranceExceededError => new ToleranceExceededError(message, violations);
