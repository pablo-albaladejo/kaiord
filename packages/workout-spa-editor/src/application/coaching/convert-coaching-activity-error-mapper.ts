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
import type { Analytics } from "@kaiord/core";
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
  // Don't treat ALL TypeErrors as transport errors — internal coding
  // bugs in the AI pipeline (e.g. `undefined.foo`) also throw
  // TypeError and would otherwise be misclassified as network. Only
  // accept TypeError when its message clearly indicates a fetch /
  // network failure; let everything else fall through to "ai-error".
  if (!(err instanceof Error)) return false;
  return /network|fetch|failed to fetch/i.test(err.message);
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

/**
 * Emit the convert-with-ai failure/cancel analytics event and shape the
 * failure result. Shared by both AI persist branches so the telemetry
 * names and the error payload stay identical.
 */
export const buildAiFailure = (
  analytics: Analytics,
  err: unknown
): { ok: false; reason: AiFailureReason; error: string } => {
  const reason = classifyAiFailure(err);
  analytics.event(
    reason === "ai-cancelled"
      ? "coaching.convert_with_ai.cancelled"
      : "coaching.convert_with_ai.failure",
    { reason }
  );
  return {
    ok: false,
    reason,
    error: err instanceof Error ? err.message : String(err),
  };
};
