/**
 * moveSession — the one athlete writer of a workout's date (design §3.3).
 *
 * In one transaction it re-reads the workout, refuses a done session, and
 * writes the new `date` on the workout and on its match with the same
 * `updatedAt`, so the card, the executed auto-link and cloud sync follow one
 * effective date. The same day returns `unchanged` before any guard, so a
 * done card dropped on its own day stays silent.
 */

import type { PersistencePort } from "../ports/persistence-port";
import type { SessionMatch } from "../types/session-match";
import {
  SessionNotMovableError,
  WorkoutNotFoundError,
} from "./move-session-errors";

export {
  SessionNotMovableError,
  type SessionNotMovableReason,
  WorkoutNotFoundError,
} from "./move-session-errors";

export type MoveSessionDeps = Pick<
  PersistencePort,
  "workouts" | "sessionMatch" | "coaching" | "activities" | "transaction"
> & { now: () => string };

export type MoveSessionInput = { workoutId: string; targetDay: string };

export type MoveSessionResult =
  | { kind: "moved"; from: string; to: string; matchId?: string }
  | { kind: "unchanged" };

const assertMovable = async (
  deps: MoveSessionDeps,
  profileId: string,
  workoutId: string,
  match: SessionMatch | undefined
): Promise<void> => {
  // A match can pair the plan with a recording while its slot stays empty.
  if (await deps.activities.referencesWorkout(profileId, workoutId))
    throw new SessionNotMovableError("executed");
  if (match) {
    if (match.executedWorkoutIds.length > 0)
      throw new SessionNotMovableError("executed");
    const activity = await deps.coaching.getById(match.coachingActivityId);
    if (activity?.status === "completed")
      throw new SessionNotMovableError("completed");
    return;
  }
  const all = await deps.sessionMatch.listByProfile(profileId);
  if (all.some((m) => m.executedWorkoutIds.includes(workoutId)))
    throw new SessionNotMovableError("executed");
};

export const moveSession = (
  deps: MoveSessionDeps,
  { workoutId, targetDay }: MoveSessionInput
): Promise<MoveSessionResult> =>
  deps.transaction(async (): Promise<MoveSessionResult> => {
    const workout = await deps.workouts.getById(workoutId);
    if (!workout) throw new WorkoutNotFoundError(workoutId);
    if (targetDay === workout.date) return { kind: "unchanged" };
    const { profileId } = workout;
    const match = await deps.sessionMatch.getByWorkoutId(profileId, workoutId);
    await assertMovable(deps, profileId, workoutId, match);
    const now = deps.now();
    await deps.workouts.put({ ...workout, date: targetDay, updatedAt: now });
    if (!match) return { kind: "moved", from: workout.date, to: targetDay };
    await deps.sessionMatch.updateDate(match.id, targetDay, now);
    return {
      kind: "moved",
      from: workout.date,
      to: targetDay,
      matchId: match.id,
    };
  });
