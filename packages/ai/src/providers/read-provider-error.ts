/**
 * The one reader of a provider failure's structured fields. The AI SDK's
 * `APICallError` carries the HTTP `statusCode` and the provider's raw
 * `responseBody`; a provider stream error chunk (Anthropic's mid-stream
 * `{ type: "overloaded_error" }`) carries its type directly. Wrappers hide
 * the call error behind `lastError` (RetryError) or `cause`, so the reader
 * walks that single chain to the first level that carries anything.
 *
 * Body fields per provider: Anthropic `error.type` + `error.message`, OpenAI
 * `error.type` + `error.code`, Google `error.status` + `error.message`.
 */
export type ProviderErrorInfo = {
  statusCode?: number;
  errorType?: string;
  errorCode?: string;
  errorStatus?: string;
  errorMessage?: string;
};

const MAX_DEPTH = 4;

const str = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;

const readBody = (body: unknown): ProviderErrorInfo => {
  if (typeof body !== "string") return {};
  try {
    const parsed = JSON.parse(body) as { error?: Record<string, unknown> };
    const e = parsed?.error;
    if (typeof e !== "object" || e === null) return {};
    return {
      errorType: str(e.type),
      errorCode: str(e.code),
      errorStatus: str(e.status),
      errorMessage: str(e.message),
    };
  } catch {
    return {};
  }
};

const isEmpty = (info: ProviderErrorInfo): boolean =>
  Object.values(info).every((v) => v === undefined);

export const readProviderError = (
  error: unknown,
  depth = 0
): ProviderErrorInfo => {
  if (typeof error !== "object" || error === null || depth > MAX_DEPTH) {
    return {};
  }
  const e = error as Record<string, unknown>;
  const ownType = str(e.type)?.endsWith("_error") ? str(e.type) : undefined;
  const body = readBody(e.responseBody);
  const info: ProviderErrorInfo = {
    statusCode: typeof e.statusCode === "number" ? e.statusCode : undefined,
    ...body,
    errorType: body.errorType ?? ownType,
  };
  if (!isEmpty(info)) return info;
  return readProviderError(e.lastError ?? e.cause, depth + 1);
};
