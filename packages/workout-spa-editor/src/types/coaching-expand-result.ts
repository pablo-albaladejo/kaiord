/**
 * Result of a lazy per-day description/comment expansion (`expandDay`).
 *
 * Lives in `types/` (not `application/`) so the `CoachingSource` port can
 * reference the failure shape without inverting the dependency direction
 * (`application` depends on `types`, never the reverse). The coaching dialog
 * consumes `ExpandActivity` from here rather than `coaching-source` (which the
 * dialog is lint-forbidden from importing to avoid coupling to the registry).
 */

import type { CoachingActivity } from "./coaching-activity";

export type ExpandFailureReason =
  "not-linked" | "session-expired" | "transport-error";

export type ExpandDayResult =
  | { ok: true; activityCount: number }
  | { ok: false; reason: ExpandFailureReason; error?: string };

/**
 * Lazy per-day description/comment fetch, as consumed by the dialog. Returns
 * the `ExpandDayResult` (or `undefined` when no source/profile is active) so a
 * failure can surface a retryable error instead of a stuck spinner.
 */
export type ExpandActivity = (
  activity: CoachingActivity
) => Promise<ExpandDayResult | undefined>;
