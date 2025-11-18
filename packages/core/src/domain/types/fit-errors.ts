/**
 * FIT-related errors
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

export const createFitParsingError = (
  message: string,
  cause?: unknown
): FitParsingError => new FitParsingError(message, cause);
