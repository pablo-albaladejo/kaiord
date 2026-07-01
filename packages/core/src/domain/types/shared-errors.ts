import type { ValidationError } from "./error-types";

/**
 * Base class for format-specific parsing errors (FIT, Garmin, TCX, Zwift).
 *
 * Subclasses only set their own `name`; the optional `cause` carries the
 * underlying failure and the offending constructor frame is trimmed from
 * the stack trace.
 */
export abstract class FormatParsingError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Base class for schema validation errors carrying an array of field-level
 * {@link ValidationError} details (KRD, TCX, ZWO).
 */
export abstract class SchemaValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: Array<ValidationError>
  ) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
