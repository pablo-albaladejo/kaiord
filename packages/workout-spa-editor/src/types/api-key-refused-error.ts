/**
 * Why an API key was not accepted, as a verified, app-authored reason: no
 * key was given, or the provider answered that it does not accept it (a
 * 401/403). The App words each reason; any other failure has no cause the
 * App can state.
 */
export type ApiKeyRefusal = "missing-key" | "rejected";

export class ApiKeyRefusedError extends Error {
  readonly reason: ApiKeyRefusal;
  constructor(reason: ApiKeyRefusal) {
    super(`API key refused: ${reason}`);
    this.name = "ApiKeyRefusedError";
    this.reason = reason;
  }
}

export const isApiKeyRefused = (error: unknown): error is ApiKeyRefusedError =>
  error instanceof ApiKeyRefusedError;
