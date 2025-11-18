import type { ValidationError } from "./error-types";

/**
 * Zwift-related errors
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

export const createZwiftParsingError = (
  message: string,
  cause?: unknown
): ZwiftParsingError => new ZwiftParsingError(message, cause);

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

export const createZwiftValidationError = (
  message: string,
  errors: Array<ValidationError>
): ZwiftValidationError => new ZwiftValidationError(message, errors);
