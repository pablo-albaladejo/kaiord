/**
 * INTERNAL, never exported from a published entry point. The raw failure a
 * wrapping error stands for: for a retryable provider error it holds the
 * request body (the user's text), so it is kept out of the error object,
 * where `console.error` or `util.inspect` would print it.
 */
const failures = new WeakMap<Error, unknown>();

/** Associates `failure` with `error`; an undefined failure is not kept. */
export const keepUnderlyingFailure = <T extends Error>(
  error: T,
  failure: unknown
): T => {
  if (failure !== undefined) failures.set(error, failure);
  return error;
};

/** The raw failure `error` wraps, or undefined when none was kept. */
export const underlyingFailureOf = (error: unknown): unknown =>
  error instanceof Error ? failures.get(error) : undefined;
