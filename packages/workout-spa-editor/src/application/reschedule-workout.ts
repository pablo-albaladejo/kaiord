/**
 * rescheduleWorkout — moves an existing workout to a different day.
 *
 * Reads the workout via the port, mutates `date` to the target ISO
 * date, and writes the record back via `repo.put`. The persistence
 * adapter wraps the operation in its own transaction; here we only
 * coordinate the read-modify-write at the application layer so the
 * Dexie + in-memory test double behave identically.
 *
 * Throws `WorkoutNotFoundError` when the workout no longer exists
 * (concurrent delete) so the caller can surface a non-fatal toast and
 * let the optimistic UI revert via `useLiveQuery` re-fetch.
 */

import type { WorkoutRepository } from "../ports/workout-repository";

export class WorkoutNotFoundError extends Error {
  constructor(workoutId: string) {
    super(`Workout not found: ${workoutId}`);
    this.name = "WorkoutNotFoundError";
  }
}

export async function rescheduleWorkout(
  repo: WorkoutRepository,
  workoutId: string,
  targetDayISO: string
): Promise<void> {
  const existing = await repo.getById(workoutId);
  if (!existing) {
    throw new WorkoutNotFoundError(workoutId);
  }
  await repo.put({ ...existing, date: targetDayISO });
}
