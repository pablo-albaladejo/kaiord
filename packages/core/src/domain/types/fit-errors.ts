/**
 * Error thrown when FIT file parsing fails.
 *
 * This error is thrown by FIT readers when they encounter corrupted files,
 * invalid FIT data, or unsupported FIT features.
 *
 * @example
 * ```typescript
 * import { FitParsingError, convertFitToKrd } from '@kaiord/core';
 *
 * try {
 *   const krd = await convertFitToKrd(fitReader, validator, logger)({
 *     fitBuffer: corruptedBuffer
 *   });
 * } catch (error) {
 *   if (error instanceof FitParsingError) {
 *     console.error('FIT parsing failed:', error.message);
 *     console.error('Cause:', error.cause);
 *   }
 * }
 * ```
 */
export class FitParsingError extends Error {
  public override readonly name = "FitParsingError";

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FitParsingError);
    }
  }
}

/**
 * Factory function to create a FitParsingError.
 *
 * Provides a functional programming style alternative to using `new FitParsingError()`.
 *
 * @param message - Error message describing the parsing failure
 * @param cause - Optional underlying error that caused the parsing failure
 * @returns A new FitParsingError instance
 *
 * @example
 * ```typescript
 * import { createFitParsingError } from '@kaiord/core';
 *
 * throw createFitParsingError('Failed to parse FIT file', originalError);
 * ```
 */
export const createFitParsingError = (
  message: string,
  cause?: unknown
): FitParsingError => new FitParsingError(message, cause);
