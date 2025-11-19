/**
 * Error Types for Workout SPA Editor
 *
 * Custom error classes for specific error scenarios.
 */

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
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileParsingError);
    }
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
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
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
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConversionError);
    }
  }
}
