/**
 * rescheduleWorkout — moves an existing workout to a different day.
 *
 * Reads the workout and writes it back with the target ISO date inside
 * one port transaction, so a coach move or a push stamp that lands
 * between the read and the write is not rolled back (the same pattern
 * as `applyCoachDateMoves`).
 *
 * Throws `WorkoutNotFoundError` when the workout no longer exists
 * (concurrent delete) so the caller can surface a non-fatal toast and
 * let the optimistic UI revert via `useLiveQuery` re-fetch.
 */

import type { PersistencePort } from "../ports/persistence-port";

export class WorkoutNotFoundError extends Error {
  constructor(workoutId: string) {
    super(`Workout not found: ${workoutId}`);
    this.name = "WorkoutNotFoundError";
  }
}

export async function rescheduleWorkout(
  persistence: Pick<PersistencePort, "workouts" | "transaction">,
  workoutId: string,
  targetDayISO: string
): Promise<void> {
  await persistence.transaction(async () => {
    const existing = await persistence.workouts.getById(workoutId);
    if (!existing) {
      throw new WorkoutNotFoundError(workoutId);
    }
    await persistence.workouts.put({ ...existing, date: targetDayISO });
  });
}
