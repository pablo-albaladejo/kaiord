/**
 * Error types for the session-match domain.
 *
 * Each error has its own constructor so callers can discriminate via
 * `instanceof` (e.g., the convert use case swallows
 * `SessionAlreadyMatchedError` from a concurrent matcher but propagates
 * other errors).
 */

const captureStack = (error: Error, constructor: NewableFunction): void => {
  const errorWithCapture = Error as typeof Error & {
    captureStackTrace?: (err: Error, constructor: NewableFunction) => void;
  };
  if (typeof errorWithCapture.captureStackTrace === "function") {
    errorWithCapture.captureStackTrace(error, constructor);
  }
};

export class SessionAlreadyMatchedError extends Error {
  public override readonly name = "SessionAlreadyMatchedError";
  constructor(message: string) {
    super(message);
    captureStack(this, SessionAlreadyMatchedError);
  }
}

export class CrossProfileMatchError extends Error {
  public override readonly name = "CrossProfileMatchError";
  constructor(message: string) {
    super(message);
    captureStack(this, CrossProfileMatchError);
  }
}

export class CoachingActivityNotFoundError extends Error {
  public override readonly name = "CoachingActivityNotFoundError";
  constructor(message: string) {
    super(message);
    captureStack(this, CoachingActivityNotFoundError);
  }
}

export class WorkoutNotFoundError extends Error {
  public override readonly name = "WorkoutNotFoundError";
  constructor(message: string) {
    super(message);
    captureStack(this, WorkoutNotFoundError);
  }
}

export class ProfileNotFoundError extends Error {
  public override readonly name = "ProfileNotFoundError";
  constructor(message: string) {
    super(message);
    captureStack(this, ProfileNotFoundError);
  }
}
