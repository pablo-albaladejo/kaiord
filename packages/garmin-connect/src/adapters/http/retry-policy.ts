// Retry policy for Garmin Connect HTTP calls: retry on rate-limit (429) and
// 5xx server errors; give up on other 4xx client errors. Backoff is
// exponential with jitter, bounded by DEFAULT_MAX_DELAY_MS.
const HTTP_TOO_MANY_REQUESTS = 429;
const SERVER_ERROR_MIN = 500;
const SERVER_ERROR_MAX = 599;

export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_BASE_DELAY_MS = 1000;
export const DEFAULT_MAX_DELAY_MS = 10000;

/** A response status is retryable when it is rate-limited or a 5xx error. */
export const isRetryable = (status: number): boolean =>
  status === HTTP_TOO_MANY_REQUESTS ||
  (status >= SERVER_ERROR_MIN && status <= SERVER_ERROR_MAX);
