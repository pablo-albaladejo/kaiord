/**
 * Pure derivation of the 4 read-only lifecycle facets shown on calendar
 * session cards (F2 cockpit): coach origin (train2go), AI assistance,
 * Garmin push, and executed+matched. Each facet is independent — a
 * session can carry any combination, so callers render whichever facets
 * are true rather than picking a single mutually-exclusive state.
 *
 * Facets read existing persisted signals only — no new Dexie fields:
 * `WorkoutRecord.source` / `.aiMeta` / `.garminPushId`, and the match's
 * executed-workout count. `pushedToGarmin` reflects `garminPushId`, the
 * canonical "last push" field written by `transitionToPushed`; note that
 * not every push entry point (`useGarminPush`) wires into it today — see
 * the F2 completion report for the gap.
 */
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";

export type SessionLifecycleFlags = {
  fromCoach: boolean;
  aiAssisted: boolean;
  pushedToGarmin: boolean;
  executedAndMatched: boolean;
};

export const deriveWorkoutLifecycle = (
  workout: Pick<WorkoutRecord, "source" | "aiMeta" | "garminPushId">,
  executedCount = 0
): SessionLifecycleFlags => ({
  fromCoach: workout.source === "train2go",
  aiAssisted: workout.source === "ai-generated" || workout.aiMeta !== null,
  pushedToGarmin: workout.garminPushId !== null,
  executedAndMatched: executedCount > 0,
});

export const deriveCoachingActivityLifecycle = (
  activity: Pick<CoachingActivity, "source">
): SessionLifecycleFlags => ({
  fromCoach: activity.source === "train2go",
  aiAssisted: false,
  pushedToGarmin: false,
  executedAndMatched: false,
});
