import type { ValidationError } from "./error-types";

/**
 * Error thrown when KRD schema validation fails.
 *
 * This error is thrown when KRD data doesn't conform to the expected schema,
 * containing detailed validation errors for each field that failed validation.
 *
 * @example
 * ```typescript
 * import { KrdValidationError, krdSchema } from '@kaiord/core';
 *
 * try {
 *   const krd = krdSchema.parse(invalidData);
 * } catch (error) {
 *   if (error instanceof KrdValidationError) {
 *     console.error('KRD validation failed:', error.message);
 *     error.errors.forEach(err => {
 *       console.error(`  ${err.field}: ${err.message}`);
 *     });
 *   }
 * }
 * ```
 */
export class KrdValidationError extends Error {
  public override readonly name = "KrdValidationError";

  constructor(
    message: string,
    public readonly errors: Array<ValidationError>
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KrdValidationError);
    }
  }
}

/**
 * Factory function to create a KrdValidationError.
 *
 * Provides a functional programming style alternative to using `new KrdValidationError()`.
 *
 * @param message - Error message describing the validation failure
 * @param errors - Array of validation errors with field-level details
 * @returns A new KrdValidationError instance
 *
 * @example
 * ```typescript
 * import { createKrdValidationError } from '@kaiord/core';
 *
 * throw createKrdValidationError('KRD validation failed', [
 *   { field: 'version', message: 'Required field missing' },
 *   { field: 'type', message: 'Invalid value' }
 * ]);
 * ```
 */
export const createKrdValidationError = (
  message: string,
  errors: Array<ValidationError>
): KrdValidationError => new KrdValidationError(message, errors);
