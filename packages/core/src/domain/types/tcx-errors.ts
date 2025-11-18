import type { ValidationError } from "./error-types";

/**
 * TCX-related errors
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

export const createTcxParsingError = (
  message: string,
  cause?: unknown
): TcxParsingError => new TcxParsingError(message, cause);

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

export const createTcxValidationError = (
  message: string,
  errors: Array<ValidationError>
): TcxValidationError => new TcxValidationError(message, errors);
