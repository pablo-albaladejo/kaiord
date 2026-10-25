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

import { usePersistence } from "../../../contexts/persistence-context";
import type { PersistencePort } from "../../../ports/persistence-port";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import {
  namespaceSourceId,
  toPersistedCoachingActivityId,
} from "../../../types/coaching-activity-record";

export type CoachingDialogState =
  | { kind: "no-workout" }
  | { kind: "converted"; workout: WorkoutRecord }
  | {
      kind: "matched";
      matchId: string;
      workout: WorkoutRecord;
      executed: WorkoutRecord[];
      /** The match's slot, including ids whose rows are gone. */
      executedWorkoutIds?: readonly string[];
      /** An activity is the planned workout or links to it. */
      recorded?: boolean;
    };

type Deps = Pick<PersistencePort, "workouts" | "sessionMatch" | "activities">;

const resolveExecuted = async (
  deps: Deps,
  ids: readonly string[]
): Promise<WorkoutRecord[]> => {
  const rows = await Promise.all(ids.map((id) => deps.workouts.getById(id)));
  // Drop dangling refs so the dialog never renders a row for a deleted
  // recording.
  return rows.filter((r): r is WorkoutRecord => Boolean(r));
};

const resolveState = async (
  deps: Deps,
  profileId: string,
  activity: CoachingActivity
): Promise<CoachingDialogState> => {
  const match = await deps.sessionMatch.getByActivityId(
    profileId,
    toPersistedCoachingActivityId(profileId, activity.id)
  );

  if (match) {
    const workout = await deps.workouts.getById(match.workoutId);
    // Dangling-ref tolerance (mirrors `useActivityMatchState`): if the
    // match references a workout that no longer exists, fall through
    // to the no-workout branch so the dialog re-offers AI/Manual/Match.
    // Stale-match cleanup belongs to the cascade hooks, not the dialog.
    if (!workout) return { kind: "no-workout" };
    const executedWorkoutIds = match.executedWorkoutIds ?? [];
    return {
      kind: "matched",
      matchId: match.id,
      workout,
      executed: await resolveExecuted(deps, executedWorkoutIds),
      executedWorkoutIds,
      recorded: await deps.activities.referencesWorkout(profileId, workout.id),
    };
  }

  const prefix = `${activity.source}:`;
  if (!activity.id.startsWith(prefix)) return { kind: "no-workout" };
  const platformId = activity.id.slice(prefix.length);
  const workout = await deps.workouts.getBySourceId(
    activity.source,
    namespaceSourceId(profileId, platformId)
  );

  if (workout) return { kind: "converted", workout };
  return { kind: "no-workout" };
};

export const useCoachingDialogState = (
  profileId: string | null,
  activity: CoachingActivity | null
): CoachingDialogState | undefined => {
  const persistence = usePersistence();
  return useLiveQuery<CoachingDialogState>(async () => {
    if (!profileId || !activity) return { kind: "no-workout" };
    return resolveState(persistence, profileId, activity);
  }, [persistence, profileId, activity?.id]);
};
