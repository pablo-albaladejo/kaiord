/**
 * Resolves the 3-state CoachingActivityDialog dispatch (per design D5):
 *
 *   - "no-workout"  — no WorkoutRecord exists for the activity AND no
 *                     SessionMatch links it to anything.
 *   - "converted"   — a WorkoutRecord exists (namespaced sourceId) but
 *                     no SessionMatch row references it. Legacy data
 *                     pre-D8 retro-fix, or any other path that wrote a
 *                     workout without the auto-match invariant. The
 *                     dialog auto-heals this on first render.
 *   - "matched"     — both a WorkoutRecord and a SessionMatch exist.
 *
 * This is a thin live-query layer; mutations live in the use cases
 * (convertCoachingActivityWithAi, convertCoachingActivityManual,
 * matchSession, unmatchSession).
 */
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../adapters/dexie/dexie-database";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import {
  namespaceSourceId,
  toPersistedCoachingActivityId,
} from "../../../types/coaching-activity-record";
import type { SessionMatch } from "../../../types/session-match";

export type CoachingDialogState =
  | { kind: "no-workout" }
  | { kind: "converted"; workout: WorkoutRecord }
  | {
      kind: "matched";
      matchId: string;
      workout: WorkoutRecord;
      executed: WorkoutRecord[];
    };

const resolveExecuted = async (
  ids: readonly string[]
): Promise<WorkoutRecord[]> => {
  if (ids.length === 0) return [];
  const rows = await db.table<WorkoutRecord>("workouts").bulkGet([...ids]);
  // `bulkGet` returns `undefined` for missing ids; drop dangling refs so
  // the dialog never renders a row for a deleted recording.
  return rows.filter((r): r is WorkoutRecord => Boolean(r));
};

const resolveState = async (
  profileId: string,
  activity: CoachingActivity
): Promise<CoachingDialogState> => {
  const match = await db
    .table<SessionMatch>("sessionMatches")
    .where("[profileId+coachingActivityId]")
    .equals([profileId, toPersistedCoachingActivityId(profileId, activity.id)])
    .first();

  if (match) {
    const workout = await db
      .table<WorkoutRecord>("workouts")
      .get(match.workoutId);
    // Dangling-ref tolerance (mirrors `useActivityMatchState`): if the
    // match references a workout that no longer exists, fall through
    // to the no-workout branch so the dialog re-offers AI/Manual/Match.
    // Stale-match cleanup belongs to the cascade hooks, not the dialog.
    if (!workout) return { kind: "no-workout" };
    const executed = await resolveExecuted(match.executedWorkoutIds ?? []);
    return { kind: "matched", matchId: match.id, workout, executed };
  }

  const prefix = `${activity.source}:`;
  if (!activity.id.startsWith(prefix)) return { kind: "no-workout" };
  const platformId = activity.id.slice(prefix.length);
  const ns = namespaceSourceId(profileId, platformId);
  const workout = await db
    .table<WorkoutRecord>("workouts")
    .where("[source+sourceId]")
    .equals([activity.source, ns])
    .first();

  if (workout) return { kind: "converted", workout };
  return { kind: "no-workout" };
};

export const useCoachingDialogState = (
  profileId: string | null,
  activity: CoachingActivity | null
): CoachingDialogState | undefined =>
  useLiveQuery<CoachingDialogState>(async () => {
    if (!profileId || !activity) return { kind: "no-workout" };
    return resolveState(profileId, activity);
  }, [profileId, activity?.id]);
