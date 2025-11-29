import type { ValidationError } from "./error-types";

/**
 * Error thrown when TCX file parsing fails.
 *
 * This error is thrown by TCX readers when they encounter invalid XML,
 * malformed TCX data, or unsupported TCX features.
 *
 * @example
 * ```typescript
 * import { TcxParsingError, convertTcxToKrd } from '@kaiord/core';
 *
 * try {
 *   const krd = await convertTcxToKrd(tcxReader, validator, logger)({
 *     tcxString: invalidXml
 *   });
 * } catch (error) {
 *   if (error instanceof TcxParsingError) {
 *     console.error('TCX parsing failed:', error.message);
 *   }
 * }
 * ```
 */
export class TcxParsingError extends Error {
  public override readonly name = "TcxParsingError";

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TcxParsingError);
    }
  }
}

/**
 * Factory function to create a TcxParsingError.
 *
 * @param message - Error message describing the parsing failure
 * @param cause - Optional underlying error that caused the parsing failure
 * @returns A new TcxParsingError instance
 */
export const createTcxParsingError = (
  message: string,
  cause?: unknown
): TcxParsingError => new TcxParsingError(message, cause);

/**
 * Error thrown when TCX schema validation fails.
 *
 * This error is thrown when TCX data doesn't conform to the expected schema.
 *
 * @example
 * ```typescript
 * import { TcxValidationError } from '@kaiord/core';
 *
 * try {
 *   // validation code
 * } catch (error) {
 *   if (error instanceof TcxValidationError) {
 *     error.errors.forEach(err => {
 *       console.error(`${err.field}: ${err.message}`);
 *     });
 *   }
 * }
 * ```
 */
export class TcxValidationError extends Error {
  public override readonly name = "TcxValidationError";

  constructor(
    message: string,
    public readonly errors: Array<ValidationError>
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TcxValidationError);
    }
  }
}

/**
 * Factory function to create a TcxValidationError.
 *
 * @param message - Error message describing the validation failure
 * @param errors - Array of validation errors with field-level details
 * @returns A new TcxValidationError instance
 */
export const createTcxValidationError = (
  message: string,
  errors: Array<ValidationError>
): TcxValidationError => new TcxValidationError(message, errors);
