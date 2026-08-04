/**
 * Editor Workflow Actions
 *
 * Transition functions for the editor-calendar integration:
 * push (structured|ready|modified -> pushed) and modify (pushed->modified).
 *
 * All KRD-carrying persistence paths route through `onWorkoutMutation`
 * so `modifiedAt` advances on every user edit in STRUCTURED / READY
 * (per spa-workout-state-machine spec), not only on PUSHED→MODIFIED.
 */

import { useCallback } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import {
  onWorkoutMutation,
  transitionToModified,
  transitionToPushed,
  transitionToReady,
} from "../../application/workout-transitions";
import { useWorkoutStore } from "../../store/workout-store";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { KRD } from "../../types/krd";

async function persistRecord(record: WorkoutRecord) {
  await db.table("workouts").put(record);
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
  const currentWorkout = useWorkoutStore((s) => s.currentWorkout);

  const pushWorkout = useCallback(
    async (garminPushId: string) => {
      if (!record) return;
      const withEdits = saveEditedKrd(record, currentWorkout ?? undefined);
      const updated = transitionToPushed(
        readyForPush(withEdits),
        garminPushId
      );
      await persistRecord(updated);
    },
    [record, currentWorkout]
  );

  const markModified = useCallback(
    async (krd: KRD) => {
      if (!record) return;
      const updated = transitionToModified(record, krd);
      await persistRecord(updated);
    },
    [record]
  );

  return { pushWorkout, markModified };
}
