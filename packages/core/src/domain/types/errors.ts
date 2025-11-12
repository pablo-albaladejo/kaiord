/**
 * Domain Errors for Kaiord
 * Following Clean Architecture error handling patterns
 */

// Supporting types for error context
export type ValidationError = {
  field: string;
  message: string;
  expected?: unknown;
  actual?: unknown;
};

export type ToleranceViolation = {
  field: string;
  expected: number;
  actual: number;
  deviation: number;
  tolerance: number;
};

/**
 * FitParsingError
 * Thrown when FIT file parsing fails in the adapter layer
 */
export class FitParsingError extends Error {
  public override readonly name = "FitParsingError";

  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FitParsingError);
    }
  }
}

/**
 * Factory function for FitParsingError
 * Provides functional interface while maintaining Error class benefits
 */
export const createFitParsingError = (
  message: string,
  cause?: unknown
): FitParsingError => new FitParsingError(message, cause);

/**
 * KrdValidationError
 * Thrown when KRD schema validation fails
 */
export class KrdValidationError extends Error {
  public override readonly name = "KrdValidationError";

  constructor(message: string, public readonly errors: Array<ValidationError>) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KrdValidationError);
    }
  }
}

/**
 * Factory function for KrdValidationError
 */
export const createKrdValidationError = (
  message: string,
  errors: Array<ValidationError>
): KrdValidationError => new KrdValidationError(message, errors);

/**
 * ToleranceExceededError
 * Thrown when round-trip conversion exceeds tolerance thresholds
 */
export class ToleranceExceededError extends Error {
  public override readonly name = "ToleranceExceededError";

  constructor(
    message: string,
    public readonly violations: Array<ToleranceViolation>
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ToleranceExceededError);
    }
  }
}

/**
 * Factory function for ToleranceExceededError
 */
export const createToleranceExceededError = (
  message: string,
  violations: Array<ToleranceViolation>
): ToleranceExceededError => new ToleranceExceededError(message, violations);
