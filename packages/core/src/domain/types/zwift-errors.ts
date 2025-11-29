import type { ValidationError } from "./error-types";

/**
 * Error thrown when Zwift workout file parsing fails.
 *
 * This error is thrown by Zwift readers when they encounter invalid XML,
 * malformed ZWO data, or unsupported Zwift features.
 *
 * @example
 * ```typescript
 * import { ZwiftParsingError, convertZwiftToKrd } from '@kaiord/core';
 *
 * try {
 *   const krd = await convertZwiftToKrd(zwiftReader, validator, logger)({
 *     zwiftString: invalidXml
 *   });
 * } catch (error) {
 *   if (error instanceof ZwiftParsingError) {
 *     console.error('Zwift parsing failed:', error.message);
 *   }
 * }
 * ```
 */
export class ZwiftParsingError extends Error {
  public override readonly name = "ZwiftParsingError";

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ZwiftParsingError);
    }
  }
}

/**
 * Factory function to create a ZwiftParsingError.
 *
 * @param message - Error message describing the parsing failure
 * @param cause - Optional underlying error that caused the parsing failure
 * @returns A new ZwiftParsingError instance
 */
export const createZwiftParsingError = (
  message: string,
  cause?: unknown
): ZwiftParsingError => new ZwiftParsingError(message, cause);

/**
 * Error thrown when Zwift schema validation fails.
 *
 * This error is thrown when Zwift data doesn't conform to the expected schema.
 *
 * @example
 * ```typescript
 * import { ZwiftValidationError } from '@kaiord/core';
 *
 * try {
 *   // validation code
 * } catch (error) {
 *   if (error instanceof ZwiftValidationError) {
 *     error.errors.forEach(err => {
 *       console.error(`${err.field}: ${err.message}`);
 *     });
 *   }
 * }
 * ```
 */
export class ZwiftValidationError extends Error {
  public override readonly name = "ZwiftValidationError";

  constructor(
    message: string,
    public readonly errors: Array<ValidationError>
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ZwiftValidationError);
    }
  }
}

/**
 * Factory function to create a ZwiftValidationError.
 *
 * @param message - Error message describing the validation failure
 * @param errors - Array of validation errors with field-level details
 * @returns A new ZwiftValidationError instance
 */
export const createZwiftValidationError = (
  message: string,
  errors: Array<ValidationError>
): ZwiftValidationError => new ZwiftValidationError(message, errors);
