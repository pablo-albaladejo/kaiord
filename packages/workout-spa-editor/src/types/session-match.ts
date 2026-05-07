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

export const sessionMatchSourceSchema = z.enum([
  "manual",
  "auto-suggestion",
  "auto-conversion",
  "auto-coaching-v10-migration",
]);

export type SessionMatchSource = z.infer<typeof sessionMatchSourceSchema>;

export const sessionMatchSchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  coachingActivityId: z.string().min(1),
  workoutId: z.string().min(1),
  /**
   * Denormalized from the matched activity at write time so the
   * `listByProfileAndWeek` query can be served by an index without
   * joining the activities table. The date is stable per match —
   * matches are created with a known activity at a known date.
   */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.iso.datetime(),
  source: sessionMatchSourceSchema,
});

export type SessionMatch = z.infer<typeof sessionMatchSchema>;
