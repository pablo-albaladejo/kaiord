/**
 * Error thrown when Garmin Connect JSON parsing fails.
 */
export class GarminParsingError extends Error {
  public override readonly name = "GarminParsingError";

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GarminParsingError);
    }
  }
}

export const createGarminParsingError = (
  message: string,
  cause?: unknown
): GarminParsingError => new GarminParsingError(message, cause);
