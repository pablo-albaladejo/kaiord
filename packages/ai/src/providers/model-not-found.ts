/**
 * Detects a provider rejecting the requested model as unknown (retired or
 * misspelled). Every chat endpoint is fixed, so an HTTP 404 from the provider
 * can only mean the model id; the text patterns cover each provider's error
 * body when the status is not carried (Anthropic `not_found_error`, OpenAI
 * `model_not_found`, Google `models/x is not found`).
 */
type ErrorLike = {
  statusCode?: unknown;
  message?: unknown;
  responseBody?: unknown;
  cause?: unknown;
  lastError?: unknown;
};

const NOT_FOUND_TEXT =
  /not_found_error|model_not_found|model[^\n]*(not found|does not exist)/i;

const MAX_DEPTH = 4;

const textOf = (err: ErrorLike): string =>
  [err.message, err.responseBody]
    .filter((v): v is string => typeof v === "string")
    .join("\n");

const matches = (error: unknown, depth: number): boolean => {
  if (depth > MAX_DEPTH || typeof error !== "object" || error === null) {
    return false;
  }
  const err = error as ErrorLike;
  if (err.statusCode === 404) return true;
  if (NOT_FOUND_TEXT.test(textOf(err))) return true;
  return matches(err.cause, depth + 1) || matches(err.lastError, depth + 1);
};

export const isModelNotFoundError = (error: unknown): boolean =>
  matches(error, 0);
