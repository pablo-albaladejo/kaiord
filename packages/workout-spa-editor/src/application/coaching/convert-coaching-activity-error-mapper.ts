/**
 * Maps an unknown thrown value from `generateKrd` to the typed reason
 * enum used by `convertCoachingActivityWithAi`. Centralised so both
 * the new-creation path and any future re-process-existing path stay
 * consistent.
 *
 * - AbortError → "ai-cancelled" (the user pressed Cancel / Escape)
 * - timeout-shaped errors → "ai-timeout"
 * - KRD validation / Zod errors → "ai-invalid-krd"
 * - network / fetch errors → "transport-error"
 * - everything else → "ai-error" (catch-all so the dialog renders the
 *   inline error banner without having to special-case provider
 *   adapters)
 */
import { KrdValidationError } from "@kaiord/core";

export type AiFailureReason =
  | "ai-error"
  | "ai-cancelled"
  | "ai-timeout"
  | "ai-invalid-krd"
  | "transport-error";

const isAbort = (err: unknown): boolean => {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error && err.name === "AbortError") return true;
  return false;
};

const isTimeout = (err: unknown): boolean =>
  err instanceof Error && /timeout|timed out/i.test(err.message);

const isTransport = (err: unknown): boolean => {
  if (err instanceof TypeError) return true; // fetch network failure
  if (err instanceof Error && /network|fetch failed/i.test(err.message))
    return true;
  return false;
};

const isInvalidKrd = (err: unknown): boolean => {
  if (err instanceof KrdValidationError) return true;
  if (err instanceof Error && /zod|invalid krd|schema/i.test(err.message))
    return true;
  return false;
};

export const classifyAiFailure = (err: unknown): AiFailureReason => {
  if (isAbort(err)) return "ai-cancelled";
  if (isTimeout(err)) return "ai-timeout";
  if (isInvalidKrd(err)) return "ai-invalid-krd";
  if (isTransport(err)) return "transport-error";
  return "ai-error";
};
