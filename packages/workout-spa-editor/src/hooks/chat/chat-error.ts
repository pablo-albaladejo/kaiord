/**
 * Maps a provider/tool failure to a stable, user-safe error-category key.
 *
 * Returns ONLY a fixed enum key — never the error message or any conversation
 * content — so the PII guard holds when the value is rendered (localized by
 * category key at the display boundary) or (optionally) toasted.
 *
 * Structured data wins over text: the AI SDK's `APICallError` carries the
 * HTTP `statusCode` and the provider's `responseBody` (whose `error.type`
 * names the failure, e.g. `invalid_request_error`). The message is only a
 * fallback, matched on word boundaries so incidental substrings ("generated",
 * "separate") can never read as a rate limit.
 */
export type ChatErrorCategory = "auth" | "rate" | "network" | "generic";

type Structured = { statusCode?: number; errorType?: string };

const AUTH_TYPES = new Set(["authentication_error", "permission_error"]);
const RATE_TYPES = new Set(["rate_limit_error", "overloaded_error"]);

const readErrorType = (body: unknown): string | undefined => {
  if (typeof body !== "string") return undefined;
  try {
    const parsed = JSON.parse(body) as { error?: { type?: unknown } };
    const type = parsed?.error?.type;
    return typeof type === "string" ? type : undefined;
  } catch {
    return undefined;
  }
};

/** Reads status/type from the error, or from the error it wraps (`cause`,
    or a RetryError's `lastError`). */
const readStructured = (error: unknown, depth = 0): Structured => {
  if (typeof error !== "object" || error === null || depth > 3) return {};
  const e = error as Record<string, unknown>;
  const statusCode =
    typeof e.statusCode === "number" ? e.statusCode : undefined;
  const errorType = readErrorType(e.responseBody);
  if (statusCode !== undefined || errorType !== undefined)
    return { statusCode, errorType };
  return readStructured(e.lastError ?? e.cause, depth + 1);
};

const fromStructured = ({
  statusCode,
  errorType,
}: Structured): ChatErrorCategory | undefined => {
  if (errorType && AUTH_TYPES.has(errorType)) return "auth";
  if (errorType && RATE_TYPES.has(errorType)) return "rate";
  if (statusCode === 401 || statusCode === 403) return "auth";
  if (statusCode === 429 || statusCode === 529) return "rate";
  if (statusCode !== undefined || errorType !== undefined) return "generic";
  return undefined;
};

export const categorizeChatError = (error: unknown): ChatErrorCategory => {
  const structured = fromStructured(readStructured(error));
  if (structured) return structured;
  const message = error instanceof Error ? error.message : String(error);
  if (/\b401\b|\bunauthori[sz]ed\b|\bapi[_\s-]?key\b/i.test(message))
    return "auth";
  if (/\b429\b|\brate[_\s-]?limit|\bquota\b|\boverloaded\b/i.test(message))
    return "rate";
  if (/\b(network|fetch|cors|timeout|timed out)\b/i.test(message))
    return "network";
  return "generic";
};
