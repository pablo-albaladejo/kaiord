/**
 * Detects a provider rejecting the requested model as unknown (retired or
 * misspelled). A 404 alone is not enough: the error text must name a model in
 * one provider's documented shape — Anthropic `not_found_error` whose message
 * names the model, OpenAI `model_not_found` / "The model `x` does not
 * exist", Google `NOT_FOUND` / "models/x is not found". The status is not
 * required, so a wrapped error that kept only the body still matches. Walks
 * `cause` and `lastError` (the AI SDK's retry wrapper) a bounded depth.
 */
type ErrorLike = {
  message?: unknown;
  responseBody?: unknown;
  cause?: unknown;
  lastError?: unknown;
};

const NAMES_A_MODEL: ReadonlyArray<(text: string) => boolean> = [
  (t) => /not_found_error/.test(t) && /\bmodel\b/i.test(t),
  (t) => /model_not_found/.test(t),
  (t) => /\bthe model `[^`]+` does not exist/i.test(t),
  (t) => /\bmodels\/[\w.-]+ is not found/i.test(t),
  (t) => /NOT_FOUND/.test(t) && /\bmodels\//.test(t),
];

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
  const text = textOf(err);
  if (NAMES_A_MODEL.some((names) => names(text))) return true;
  return matches(err.cause, depth + 1) || matches(err.lastError, depth + 1);
};

export const isModelNotFoundError = (error: unknown): boolean =>
  matches(error, 0);
