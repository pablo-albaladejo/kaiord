/**
 * saveWorkoutEdits — persists the editor's KRD onto a scheduled workout.
 *
 * The change is applied to the row as stored, inside one port transaction:
 * a concurrent writer's fields (a coach move's date, a push stamp) are kept,
 * and a workout deleted meanwhile stays deleted (nothing is written and the
 * result is `false`). A pushed workout becomes `modified`; any other state
 * keeps its state, with `modifiedAt` advanced.
 */

import type { PersistencePort } from "../ports/persistence-port";
import type { WorkoutRecord } from "../types/calendar-record";
import type { KRD } from "../types/krd";
import { onWorkoutMutation, transitionToModified } from "./workout-transitions";

type WorkoutWriter = Pick<PersistencePort, "workouts" | "transaction">;

/** Applies `change` to the stored row; `false` when the row is gone. */
export async function updateWorkoutRecord(
  persistence: WorkoutWriter,
  id: string,
  change: (fresh: WorkoutRecord) => WorkoutRecord
): Promise<boolean> {
  let written = false;
  await persistence.transaction(async () => {
    const fresh = await persistence.workouts.getById(id);
    if (!fresh) return;
    await persistence.workouts.put(change(fresh));
    written = true;
  });
  return written;
}

export function applyEditedKrd(
  record: WorkoutRecord,
  editedKrd: KRD | undefined
): WorkoutRecord {
  if (!editedKrd || editedKrd === record.krd) return record;
  return record.state === "pushed"
    ? transitionToModified(record, editedKrd)
    : onWorkoutMutation(record, { krd: editedKrd });
}

export const saveWorkoutEdits = (
  persistence: WorkoutWriter,
  id: string,
  editedKrd: KRD
): Promise<boolean> =>
  updateWorkoutRecord(persistence, id, (fresh) =>
    applyEditedKrd(fresh, editedKrd)
  );
