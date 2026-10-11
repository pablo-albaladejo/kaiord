/**
 * restoreDeletedWorkout — the Undo of a workout delete.
 *
 * The delete left a `[workouts+id]` tombstone, and `mergeSnapshots` drops
 * any row whose clock is not newer than it. So the row is written back
 * with `updatedAt` stamped HERE, after the tombstone's `deletedAt` (one
 * millisecond after it when the clock has not moved): the restored row then
 * beats its own tombstone on every device. A workout that exists again
 * (another writer, a sync) is left as it is.
 */

import type { PersistencePort } from "../ports/persistence-port";
import type { WorkoutRecord } from "../types/calendar-record";

type Restorer = Pick<
  PersistencePort,
  "workouts" | "tombstones" | "transaction"
>;

export async function restoreDeletedWorkout(
  persistence: Restorer,
  deleted: WorkoutRecord
): Promise<void> {
  await persistence.transaction(async () => {
    if (await persistence.workouts.getById(deleted.id)) return;
    const tombstone = await persistence.tombstones.get("workouts", deleted.id);
    const floor = tombstone ? Date.parse(tombstone.deletedAt) + 1 : 0;
    const updatedAt = new Date(Math.max(Date.now(), floor)).toISOString();
    await persistence.workouts.put({ ...deleted, updatedAt });
  });
}
