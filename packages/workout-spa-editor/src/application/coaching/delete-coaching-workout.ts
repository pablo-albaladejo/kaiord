/**
 * Delete a Workout together with its Match, and the Undo that brings both
 * back, so no Match is left pointing at nothing (that would keep the
 * Activity's next build from being matched). Both deletes go through the tombstoning port; the Undo writes each row
 * back newer than its tombstone, so it wins on every device.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { SessionMatch } from "../../types/session-match";
import { restoreDeletedWorkout } from "../restore-deleted-workout";

type Deleter = Pick<
  PersistencePort,
  "workouts" | "sessionMatch" | "transaction"
>;
type Restorer = Deleter & Pick<PersistencePort, "tombstones">;

export type DeletedWorkout = {
  workout: WorkoutRecord;
  match: SessionMatch | undefined;
};

export const deleteWorkoutAndMatch = (
  persistence: Deleter,
  workoutId: string
): Promise<DeletedWorkout | undefined> =>
  persistence.transaction(async () => {
    const workout = await persistence.workouts.getById(workoutId);
    if (!workout) return undefined;
    const match = await persistence.sessionMatch.getByWorkoutId(
      workout.profileId,
      workout.id
    );
    if (match) await persistence.sessionMatch.delete(match.id);
    await persistence.workouts.delete(workout.id);
    return { workout, match };
  });

const restoreMatch = (persistence: Restorer, match: SessionMatch) =>
  persistence.transaction(async () => {
    const { sessionMatch } = persistence;
    const slotInUse =
      (await sessionMatch.getById(match.id)) ??
      (await sessionMatch.getByActivityId(
        match.profileId,
        match.coachingActivityId
      ));
    if (slotInUse) return;
    const tombstone = await persistence.tombstones.get(
      "sessionMatches",
      match.id
    );
    const newerThanTombstone = tombstone
      ? Date.parse(tombstone.deletedAt) + 1
      : 0;
    const updatedAt = new Date(
      Math.max(Date.now(), newerThanTombstone)
    ).toISOString();
    await sessionMatch.put({ ...match, updatedAt });
  });

export const restoreWorkoutAndMatch = async (
  persistence: Restorer,
  deleted: DeletedWorkout
): Promise<void> => {
  await restoreDeletedWorkout(persistence, deleted.workout);
  if (deleted.match) await restoreMatch(persistence, deleted.match);
};
