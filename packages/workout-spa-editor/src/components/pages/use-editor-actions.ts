/**
 * Editor Workflow Actions
 *
 * Transition functions for the editor-calendar integration:
 * push (structured|ready|modified -> pushed; pushed keeps its state and
 * records the new id).
 *
 * All KRD-carrying persistence paths route through `onWorkoutMutation`
 * so `modifiedAt` advances on every user edit in STRUCTURED / READY
 * (per spa-workout-state-machine spec), not only on PUSHED→MODIFIED.
 */

import { useCallback } from "react";

import { recordGarminPush } from "../../application/record-garmin-push";
import {
  onWorkoutMutation,
  transitionToReady,
} from "../../application/workout-transitions";
import { usePersistence } from "../../contexts/persistence-context";
import type { PersistencePort } from "../../ports/persistence-port";
import { useWorkoutStore } from "../../store/workout-store";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { KRD } from "../../types/krd";

/* Applies a change to the row as stored, in one transaction: a concurrent
   writer's fields (a coach move's date landing before the editor
   re-renders) are kept, and a workout deleted meanwhile stays deleted. */
async function updateRecord(
  persistence: PersistencePort,
  id: string,
  change: (fresh: WorkoutRecord) => WorkoutRecord
) {
  await persistence.transaction(async () => {
    const fresh = await persistence.workouts.getById(id);
    if (fresh) await persistence.workouts.put(change(fresh));
  });
}

function saveEditedKrd(
  record: WorkoutRecord,
  editedKrd: KRD | undefined
): WorkoutRecord {
  if (!editedKrd || editedKrd === record.krd) return record;
  return onWorkoutMutation(record, { krd: editedKrd });
}

/* Sending implies accepting. `structured → ready` used to be a separate
   button ("Accept Workout") on a bar that never showed it beside the push,
   so the two halves of one decision were never visible together. The
   transition still happens — it is just no longer something to click. */
function readyForPush(record: WorkoutRecord): WorkoutRecord {
  return record.state === "structured" ? transitionToReady(record) : record;
}

export function useEditorActions(record: WorkoutRecord | undefined) {
  const persistence = usePersistence();
  const currentWorkout = useWorkoutStore((s) => s.currentWorkout);

  const pushWorkout = useCallback(
    async (garminPushId: string) => {
      if (!record) return;
      // The editor's own edit is judged against the copy it opened.
      const edited =
        currentWorkout && currentWorkout !== record.krd
          ? currentWorkout
          : undefined;
      // An already-pushed record (a re-created library workout) only
      // records the new id: there is no transition left to take.
      await updateRecord(persistence, record.id, (fresh) =>
        recordGarminPush(
          readyForPush(saveEditedKrd(fresh, edited)),
          garminPushId
        )
      );
    },
    [persistence, record, currentWorkout]
  );

  return { pushWorkout };
}
