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

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
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

/**
 * TcxParsingError
 * Thrown when TCX file parsing fails in the adapter layer
 */
export class TcxParsingError extends Error {
  public override readonly name = "TcxParsingError";

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TcxParsingError);
    }
  }
}

/**
 * Factory function for TcxParsingError
 * Provides functional interface while maintaining Error class benefits
 */
export const createTcxParsingError = (
  message: string,
  cause?: unknown
): TcxParsingError => new TcxParsingError(message, cause);

/**
 * TcxValidationError
 * Thrown when TCX XSD schema validation fails
 */
export class TcxValidationError extends Error {
  public override readonly name = "TcxValidationError";

  constructor(
    message: string,
    public readonly errors: Array<{ path: string; message: string }>
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TcxValidationError);
    }
  }
}

/**
 * Factory function for TcxValidationError
 */
export const createTcxValidationError = (
  message: string,
  errors: Array<{ path: string; message: string }>
): TcxValidationError => new TcxValidationError(message, errors);

/**
 * ZwiftParsingError
 * Thrown when Zwift file parsing fails in the adapter layer
 */
export class ZwiftParsingError extends Error {
  public override readonly name = "ZwiftParsingError";

  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ZwiftParsingError);
    }
  }
}

/**
 * Factory function for ZwiftParsingError
 * Provides functional interface while maintaining Error class benefits
 */
export const createZwiftParsingError = (
  message: string,
  cause?: unknown
): ZwiftParsingError => new ZwiftParsingError(message, cause);

/**
 * ZwiftValidationError
 * Thrown when Zwift XSD schema validation fails
 */
export class ZwiftValidationError extends Error {
  public override readonly name = "ZwiftValidationError";

  constructor(
    message: string,
    public readonly errors: Array<{ path: string; message: string }>
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ZwiftValidationError);
    }
  }
}

/**
 * Factory function for ZwiftValidationError
 */
export const createZwiftValidationError = (
  message: string,
  errors: Array<{ path: string; message: string }>
): ZwiftValidationError => new ZwiftValidationError(message, errors);
