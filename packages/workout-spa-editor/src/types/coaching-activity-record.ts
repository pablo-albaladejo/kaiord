/**
 * CoachingActivityRecord — persisted shape for coaching activities
 *
 * Stored in the `coachingActivities` Dexie table. Composite primary key
 * `${profileId}:${source}:${sourceId}` ensures profile-scoped uniqueness
 * and supports deterministic upsert.
 *
 * `workload` is the platform-native metric, preserved verbatim (NOT clamped).
 * `intensity` is the mapper-normalized 1-5 dot indicator.
 * `status` is the coach-owned discrete workflow state.
 * `completionPercent` is partial-completion (0-100), orthogonal to status.
 *
 * `sourceId` MUST be captured as a string at the JSON parse boundary in
 * the platform-specific transport adapter — never `String(parsedNumber)`,
 * which is lossy for ids above Number.MAX_SAFE_INTEGER.
 */

import { z } from "zod";

export const coachingActivityStatusSchema = z.enum([
  "pending",
  "completed",
  "skipped",
]);

export type CoachingActivityStatus = z.infer<
  typeof coachingActivityStatusSchema
>;

export const coachingActivityRecordSchema = z
  .object({
    id: z.string().min(1),
    profileId: z.string().min(1),
    source: z.string().min(1),
    sourceId: z.string().min(1),
    /** YYYY-MM-DD in user's local timezone, matching spa-calendar week-id convention (Monday-start ISO weeks). */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sport: z.string(),
    title: z.string(),
    duration: z.string().optional(),
    workload: z.number().optional(),
    intensity: z
      .union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
      ])
      .optional(),
    status: coachingActivityStatusSchema,
    completionPercent: z.number().min(0).max(100).optional(),
    description: z.string().optional(),
    fetchedAt: z.iso.datetime(),
  })
  .refine(
    (rec) => rec.id === `${rec.profileId}:${rec.source}:${rec.sourceId}`,
    { message: "id must be `${profileId}:${source}:${sourceId}`" }
  );

export type CoachingActivityRecord = z.infer<
  typeof coachingActivityRecordSchema
>;

/** Builds the canonical composite id for a coaching activity row. */
export const buildCoachingActivityId = (
  profileId: string,
  source: string,
  sourceId: string
): string => `${profileId}:${source}:${sourceId}`;

/**
 * Namespaces a raw platform sourceId by profile for use as `WorkoutRecord.sourceId`.
 *
 * The `[source+sourceId]` Dexie index on the `workouts` table makes
 * convert-to-workout idempotency profile-scoped: two profiles linking the
 * same Train2Go account each get their own editable workout from the same
 * source activity.
 *
 * Asymmetry note: the workout namespace omits `source` because
 * `WorkoutRecord.source` is already a separate column. The coaching
 * activity composite id includes `source` because `coachingActivities.id`
 * is the only key. This asymmetry is deliberate and lives only here.
 */
export const namespaceSourceId = (
  profileId: string,
  rawSourceId: string
): string => `${profileId}:${rawSourceId}`;
