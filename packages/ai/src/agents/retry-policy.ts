/**
 * Retry-classification helpers shared by the generate loop. We own the retry
 * loop, so the AI SDK's internal retry layer is disabled at the call site.
 */
export const MAX_ERROR_LENGTH = 200;

const HTTP_REQUEST_TIMEOUT = 408;
const HTTP_TOO_MANY_REQUESTS = 429;

/** 4xx transport errors are permanent — except 408/429, which are transient. */
export const isNonRetryableTransport = (error: unknown): boolean => {
  const status = (error as { statusCode?: unknown })?.statusCode;
  if (typeof status !== "number") return false;
  if (status < 400 || status >= 500) return false;
  return status !== HTTP_REQUEST_TIMEOUT && status !== HTTP_TOO_MANY_REQUESTS;
};

/** Aborted/timed-out runs must stop immediately, never retry. */
export const isAbortError = (error: unknown): boolean => {
  const name = (error as { name?: unknown })?.name;
  return name === "AbortError" || name === "TimeoutError";
};

export const truncate = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max)}...` : text;
