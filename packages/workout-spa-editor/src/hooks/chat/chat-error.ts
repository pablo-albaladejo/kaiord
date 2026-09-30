/**
 * Maps a provider/tool failure to a stable, user-safe error-category key.
 *
 * Returns ONLY a fixed enum key — never the error message or any conversation
 * content — so the PII guard holds when the value is rendered (localized by
 * category key at the display boundary) or (optionally) toasted.
 *
 * Structured data wins over text: the AI SDK's `APICallError` carries the
 * HTTP `statusCode` and the provider's `responseBody` (whose `error.type`
 * names the failure, e.g. `invalid_request_error`), read through
 * `readProviderError` from `@kaiord/ai/providers`, the one cause walker.
 * The message is only a fallback, matched on word boundaries so incidental
 * substrings ("generated", "separate") can never read as a rate limit.
 */
import {
  isModelNotFoundError,
  type ProviderErrorInfo,
  readProviderError,
} from "@kaiord/ai/providers";

export type ChatErrorCategory =
  "auth" | "model" | "rate" | "network" | "generic";

const AUTH_TYPES = new Set(["authentication_error", "permission_error"]);
const RATE_TYPES = new Set(["rate_limit_error", "overloaded_error"]);

const fromStructured = (
  info: ProviderErrorInfo,
  missingModel: boolean
): ChatErrorCategory | undefined => {
  const { statusCode, errorType } = info;
  if (errorType && AUTH_TYPES.has(errorType)) return "auth";
  if (errorType && RATE_TYPES.has(errorType)) return "rate";
  if (statusCode === 401 || statusCode === 403) return "auth";
  // 503/529 mean "unavailable / overloaded, retry soon" — same advice as 429.
  if (statusCode === 429 || statusCode === 503 || statusCode === 529)
    return "rate";
  // A retired or misspelled model, before the generic fallback. A 404 alone
  // is not enough: isModelNotFoundError needs the body to name the model.
  if (missingModel) return "model";
  if (Object.values(info).some((v) => v !== undefined)) return "generic";
  return undefined;
};

// Word-bounded; `_` also delimits so provider codes such as
// `insufficient_quota` or `overloaded_error` match while "generated" does not.
const AUTH_TEXT = /\b401\b|\bunauthori[sz]ed\b|\bapi[_\s-]?key\b/i;
const RATE_TEXT =
  /\b429\b|\brate[_\s-]?limit|(?:\b|_)(?:quota|overload(?:ed)?)(?:\b|_)/i;
const NETWORK_TEXT = /\b(network|fetch|cors|timeout|timed out)\b/i;

const messageOf = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return String(error);
};

export const categorizeChatError = (error: unknown): ChatErrorCategory => {
  const missingModel = isModelNotFoundError(error);
  const structured = fromStructured(readProviderError(error), missingModel);
  if (structured) return structured;
  if (missingModel) return "model";
  const message = messageOf(error);
  if (AUTH_TEXT.test(message)) return "auth";
  if (RATE_TEXT.test(message)) return "rate";
  if (NETWORK_TEXT.test(message)) return "network";
  return "generic";
};
