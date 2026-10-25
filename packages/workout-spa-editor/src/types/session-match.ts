/**
 * SessionMatch — links a planned coaching activity with the executed workout.
 *
 * Profile-scoped: uniqueness is enforced per `(profileId, coachingActivityId)`
 * AND per `(profileId, workoutId)`; the same workout MAY be matched in
 * different profiles independently because workouts are profile-agnostic.
 *
 * `source` distinguishes provenance for analytics: explicit user action,
 * acceptance of an auto-match suggestion, or auto-link from convert flow.
 */

import { z } from "zod";

export const SESSION_MATCH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const sessionMatchSourceSchema = z.enum([
  "manual",
  "auto-suggestion",
  "auto-coaching",
  "auto-coaching-v10-migration",
]);

export type SessionMatchSource = z.infer<typeof sessionMatchSourceSchema>;

export const sessionMatchSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  coachingActivityId: z.string().min(1),
  workoutId: z.string().min(1),
  /**
   * The session's effective date, denormalized so `listByProfileAndWeek`
   * is served by the `[profileId+date]` index. It equals the matched
   * workout's `date` after every date writer and after the heal, except
   * for a locked match (an executed slot, or a `completed` activity),
   * which keeps the day of its recording.
   */
  date: z.string().regex(SESSION_MATCH_DATE_PATTERN),
  createdAt: z.iso.datetime(),
  /** Stamped by every re-date; the merge clock prefers it over `createdAt`. */
  updatedAt: z.iso.datetime().optional(),
  source: sessionMatchSourceSchema,
  /**
   * Executed activities (e.g., Garmin/FIT recordings) auto-linked to
   * the same `(profileId, date, canonical sport)` slot. 1–N executeds
   * collapse into the same `MatchedSessionCard` as additional slots.
   *
   * `.default([])` keeps Dexie v11 rows readable until the v12 upgrade
   * backfills the field; once backfilled the array is always present.
   */
  executedWorkoutIds: z.array(z.string()).default([]),
});

export type SessionMatch = z.infer<typeof sessionMatchSchema>;

/** Throws on a date that is not `YYYY-MM-DD`; adapters call it before a re-date. */
export const assertSessionMatchDate = (date: string): void => {
  if (!SESSION_MATCH_DATE_PATTERN.test(date))
    throw new Error(`Invalid session match date: ${date}`);
};

/**
 * Every workout id the profile's other matches plan or hold (design §3.7):
 * an append never gives one of them to `matchId`, whatever week it is in.
 */
export const idsHeldByOtherMatches = (
  matches: readonly SessionMatch[],
  matchId: string
): Set<string> =>
  new Set(
    matches
      .filter((m) => m.id !== matchId)
      .flatMap((m) => [m.workoutId, ...(m.executedWorkoutIds ?? [])])
  );
