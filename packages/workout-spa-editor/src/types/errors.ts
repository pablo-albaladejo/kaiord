/**
 * Error Types for Workout SPA Editor
 *
 * Custom error classes for specific error scenarios.
 */

/**
 * Helper to capture stack trace in V8-based environments
 */
const captureStack = (error: Error, constructor: NewableFunction): void => {
  const errorWithCapture = Error as typeof Error & {
    captureStackTrace?: (err: Error, constructor: NewableFunction) => void;
  };
  if (typeof errorWithCapture.captureStackTrace === "function") {
    errorWithCapture.captureStackTrace(error, constructor);
  }
};

/**
 * Error thrown when file parsing fails
 */
export class FileParsingError extends Error {
  public override readonly name = "FileParsingError";
  public readonly line?: number;
  public readonly column?: number;
  public readonly cause?: unknown;

  constructor(
    message: string,
    line?: number,
    column?: number,
    cause?: unknown
  ) {
    super(message);
    this.line = line;
    this.column = column;
    this.cause = cause;
    captureStack(this, FileParsingError);
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends Error {
  public override readonly name = "ValidationError";
  public readonly errors: Array<{ field: string; message: string }>;
  public readonly cause?: unknown;

  constructor(
    message: string,
    errors: Array<{ field: string; message: string }>,
    cause?: unknown
  ) {
    super(message);
    this.errors = errors;
    this.cause = cause;
    captureStack(this, ValidationError);
  }
}

/**
 * Error thrown when format conversion fails
 */
export class ConversionError extends Error {
  public override readonly name = "ConversionError";
  public readonly format: string;
  public readonly details?: string;
  public readonly cause?: unknown;

  constructor(
    message: string,
    format: string,
    details?: string,
    cause?: unknown
  ) {
    super(message);
    this.format = format;
    this.details = details;
    this.cause = cause;
    captureStack(this, ConversionError);
  }
}
