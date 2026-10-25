import type { PersistencePort } from "../ports/persistence-port";
import type { WorkoutRecord } from "../types/calendar-record";
import { isMovableSession, type Movability } from "./session-movability";

export type SessionMovabilityDeps = Pick<
  PersistencePort,
  "sessionMatch" | "coaching" | "activities"
>;

/** A stored workout's movability, read as `moveSession` guards it (§3.8). */
export const readSessionMovability = async (
  deps: SessionMovabilityDeps,
  profileId: string,
  workout: WorkoutRecord
): Promise<Movability> => {
  const match = await deps.sessionMatch.getByWorkoutId(profileId, workout.id);
  const activity = match
    ? await deps.coaching.getById(match.coachingActivityId)
    : undefined;
  return isMovableSession({
    workout,
    activity: { status: activity?.status ?? "pending" },
    match,
    // As in `moveSession`: only a planned side counts as a held recording.
    recorded:
      match !== undefined &&
      (await deps.activities.referencesWorkout(profileId, workout.id)),
  });
};
