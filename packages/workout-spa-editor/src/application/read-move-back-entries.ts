/**
 * The notice state is static; this reads each overridden workout now
 * (design §3.9). An entry is dropped once its workout is gone or no longer
 * on the coach's date, since the athlete or the coach moved it again.
 */
import type { PersistencePort } from "../ports/persistence-port";
import type { OverriddenSession } from "./coaching/apply-coach-date-moves";
import { isMovableSession, type Movability } from "./session-movability";

export type MoveBackEntry = OverriddenSession & { movability: Movability };

type Deps = Pick<PersistencePort, "workouts" | "sessionMatch" | "coaching">;

const readOne = async (
  deps: Deps,
  profileId: string,
  entry: OverriddenSession
): Promise<MoveBackEntry | undefined> => {
  const workout = await deps.workouts.getById(entry.workoutId);
  if (!workout || workout.date !== entry.coachDate) return undefined;
  const match = await deps.sessionMatch.getByWorkoutId(profileId, workout.id);
  const activity = match
    ? await deps.coaching.getById(match.coachingActivityId)
    : undefined;
  const movability = isMovableSession({
    workout,
    activity: { status: activity?.status ?? "pending" },
    match,
  });
  return { ...entry, movability };
};

export const readMoveBackEntries = async (
  deps: Deps,
  profileId: string,
  overridden: readonly OverriddenSession[]
): Promise<MoveBackEntry[]> => {
  const read = await Promise.all(
    overridden.map((entry) => readOne(deps, profileId, entry))
  );
  return read.filter((e): e is MoveBackEntry => e !== undefined);
};
