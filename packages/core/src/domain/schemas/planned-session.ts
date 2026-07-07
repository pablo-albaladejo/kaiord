import { z } from "zod";

/**
 * Coach-owned workflow state for a planned session. Mirrors the discrete
 * lifecycle carried on the persisted coaching record.
 */
export const plannedSessionStatusSchema = z.enum([
  "pending",
  "completed",
  "skipped",
]);

export type PlannedSessionStatus = z.infer<typeof plannedSessionStatusSchema>;

/**
 * Zod schema for a `planned-session` — a single coach-prescribed session
 * (what Train2Go delivers per calendar day). Replaces the decorative
 * `training-plan` managed type: the routable unit is the individual
 * session; the "plan" is the collection of sessions on the calendar.
 *
 * Snake_case per the domain schema convention. Fields are derived from the
 * persisted `CoachingActivityRecord` so a coaching activity maps to a
 * planned session without loss: external identity, date, sport, prescribed
 * load/intensity, coach notes, and workflow status.
 */
export const plannedSessionSchema = z.object({
  kind: z.literal("planned_session"),
  /** YYYY-MM-DD in the athlete's local timezone (ISO Monday-start weeks). */
  date: z.iso.date(),
  sport: z.string(),
  title: z.string(),
  /** Free-text coach prescription (may carry markdown `[label](url)` links). */
  coach_notes: z.string().optional(),
  /** Prescribed duration in seconds. */
  duration_seconds: z.number().int().nonnegative().optional(),
  /** Platform-native training load, preserved verbatim (never clamped). */
  workload: z.number().nonnegative().optional(),
  /** Normalized 1-5 intensity indicator. */
  intensity: z.number().int().min(1).max(5).optional(),
  status: plannedSessionStatusSchema,
  /** Partial-completion 0-100, orthogonal to status. */
  completion_percent: z.number().min(0).max(100).optional(),
  /** Provenance source key (e.g. `"train2go"`). */
  source: z.string(),
  /** Stable external id within the source. */
  source_id: z.string(),
});

export type PlannedSession = z.infer<typeof plannedSessionSchema>;
