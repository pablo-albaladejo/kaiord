/**
 * Detects a provider rejecting the requested model as unknown (retired or
 * misspelled). A 404 alone is not enough: the provider must name a model.
 * Structured fields win, read through the shared `readProviderError` (the
 * only cause/lastError walker):
 * Anthropic `not_found_error` whose message names a model, OpenAI
 * `model_not_found`, Google `NOT_FOUND` on a `models/...` path. Only when no
 * structured field exists does the top-level message decide ("The model `x`
 * does not exist", "models/x is not found").
 */
import {
  type ProviderErrorInfo,
  readProviderError,
} from "./read-provider-error";

const MODEL_WORD = /\bmodel\b/i;
const MODEL_PATH = /\bmodels\//;
const MISSING_MODEL_TEXT =
  /\bthe model `[^`]+` does not exist|\bmodels\/[\w.-]+ is not found|model_not_found/i;

/** True when the structured fields say the requested model does not exist. */
export const namesMissingModel = (info: ProviderErrorInfo): boolean => {
  const message = info.errorMessage ?? "";
  if (info.errorType === "not_found_error") return MODEL_WORD.test(message);
  if (info.errorCode === "model_not_found") return true;
  if (info.errorStatus === "NOT_FOUND") return MODEL_PATH.test(message);
  return false;
};

const messageOf = (error: unknown): string => {
  if (typeof error !== "object" || error === null) return "";
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : "";
};

export const isModelNotFoundError = (error: unknown): boolean => {
  const info = readProviderError(error);
  if (namesMissingModel(info)) return true;
  // A body that names its failure is authoritative; only body-less errors
  // fall back to the message.
  if (info.errorType || info.errorCode || info.errorStatus) return false;
  return MISSING_MODEL_TEXT.test(messageOf(error));
};
