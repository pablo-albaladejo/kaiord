import { FormatParsingError } from "./shared-errors";

/**
 * Error thrown when Garmin Connect JSON parsing fails.
 */
export class GarminParsingError extends FormatParsingError {
  public override readonly name = "GarminParsingError";
}

export const createGarminParsingError = (
  message: string,
  cause?: unknown
): GarminParsingError => new GarminParsingError(message, cause);
