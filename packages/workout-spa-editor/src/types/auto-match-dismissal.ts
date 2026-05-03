/**
 * AutoMatchDismissal — records every auto-match suggestion the user
 * rejected for a given (profileId, weekStart). The model is per-pair
 * and TTL-free: once a `(activityId, workoutId)` pair lands in
 * `dismissedPairs`, the banner never re-surfaces it for that week on
 * the same device, regardless of how many times `autoMatchSessions`
 * re-runs (per design D15 of calendar-coaching-redesign-completion).
 *
 * Each per-pair `dismissedAt` is sourced from an injected clock so the
 * use cases stay deterministic in tests.
 *
 * Legacy migration: an installation that pre-dates this change may
 * still carry a row of the old single-timestamp shape
 * `{ profileId, weekStart, dismissedAt }`. The repository surfaces such
 * rows as `dismissedPairs: []`; the legacy `dismissedAt` is dead data
 * and is dropped on the next `put`.
 */

import { z } from "zod";

export const autoMatchDismissedPairSchema = z.object({
  activityId: z.string().min(1),
  workoutId: z.string().min(1),
  dismissedAt: z.iso.datetime(),
});

export type AutoMatchDismissedPair = z.infer<
  typeof autoMatchDismissedPairSchema
>;

export const autoMatchDismissalSchema = z.object({
  profileId: z.string().min(1),
  /** Monday (ISO week-start) of the dismissed week, YYYY-MM-DD. */
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dismissedPairs: z.array(autoMatchDismissedPairSchema),
});

export type AutoMatchDismissal = z.infer<typeof autoMatchDismissalSchema>;
