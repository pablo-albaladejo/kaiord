/**
 * Split a Coaching Activity from its Workout and keep them apart. The Match
 * goes, and a Workout built from that Activity is detached from it (its
 * `sourceId` cleared, stamped newer so the split syncs): nothing then finds
 * it as the Activity's Workout, so the dialog's auto-heal no longer pairs
 * them again and the Activity is "To prepare". A Workout matched by hand
 * keeps its own provenance.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { WorkoutRecord } from "../../types/calendar-record";
import {
  buildCoachingActivityId,
  platformSourceId,
} from "../../types/coaching-activity-record";
import { CrossProfileMatchError } from "../../types/session-match-errors";
import { updateWorkoutRecord } from "../save-workout-edits";

export type SplitDeps = Pick<
  PersistencePort,
  "workouts" | "sessionMatch" | "transaction"
> & { clock: () => string };

export type SplitInput = { profileId: string; matchId: string };

const builtFrom = (workout: WorkoutRecord, coachingActivityId: string) => {
  const platformId = platformSourceId(workout.profileId, workout.sourceId);
  if (platformId === undefined) return false;
  return (
    buildCoachingActivityId(workout.profileId, workout.source, platformId) ===
    coachingActivityId
  );
};

const removeMatch = (deps: SplitDeps, input: SplitInput) =>
  deps.transaction(async () => {
    const match = await deps.sessionMatch.getById(input.matchId);
    if (!match) return undefined;
    if (match.profileId !== input.profileId)
      throw new CrossProfileMatchError(
        `match ${input.matchId} belongs to profile ${match.profileId}, not ${input.profileId}`
      );
    await deps.sessionMatch.delete(match.id);
    return match;
  });

export const splitCoachingWorkout = async (
  deps: SplitDeps,
  input: SplitInput
): Promise<void> => {
  const match = await removeMatch(deps, input);
  if (!match) return;
  await updateWorkoutRecord(deps, match.workoutId, (fresh) =>
    builtFrom(fresh, match.coachingActivityId)
      ? { ...fresh, sourceId: null, updatedAt: deps.clock() }
      : undefined
  );
};
