/**
 * Classifies a calendar write's answer (design §3.4). Definite: nothing was
 * created. Ambiguous: Garmin may have created it — resolved by reading the
 * calendar, never by a blind re-POST. Two bridge rules make the definite
 * rows safe: `needsReauth` is set only before a write was sent or after a
 * 401 retry, and only pre-fetch refusals carry `retryable: false`.
 */
import type { BridgeFailure } from "./garmin-calendar-port";

export type DefiniteReason =
  "not-found" | "schedule-rejected" | "needs-reauth" | "deadline-before-send";

export type WriteClass =
  | { kind: "ok" }
  | { kind: "definite"; reason: DefiniteReason }
  | { kind: "ambiguous" };

const DEADLINE_BEFORE_SEND = "deadline-before-send";
const REJECTED_STATUSES = new Set([400, 403, 409]);

const definite = (reason: DefiniteReason): WriteClass => ({
  kind: "definite",
  reason,
});

export const classifyBridgeWrite = (
  answer: { ok: true } | BridgeFailure
): WriteClass => {
  if (answer.ok) return { kind: "ok" };
  if (answer.delivered === false) return { kind: "ambiguous" };
  if (answer.needsReauth) return definite("needs-reauth");
  if (answer.status === 404) return definite("not-found");
  if (answer.status !== undefined && REJECTED_STATUSES.has(answer.status))
    return definite("schedule-rejected");
  if (answer.status === undefined) {
    if (answer.error === DEADLINE_BEFORE_SEND)
      return definite("deadline-before-send");
    if (answer.retryable === false) return definite("schedule-rejected");
  }
  // No status (deadline-exceeded included), 5xx, or any other answer.
  return { kind: "ambiguous" };
};
