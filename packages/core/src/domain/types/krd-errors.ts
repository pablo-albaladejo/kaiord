import type { ValidationError } from "./error-types";

/**
 * KRD validation errors
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

export const createKrdValidationError = (
  message: string,
  errors: Array<ValidationError>
): KrdValidationError => new KrdValidationError(message, errors);
