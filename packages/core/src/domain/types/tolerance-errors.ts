import type { ToleranceViolation } from "./error-types";

/**
 * Tolerance checking errors
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

export const createToleranceExceededError = (
  message: string,
  violations: Array<ToleranceViolation>
): ToleranceExceededError => new ToleranceExceededError(message, violations);
