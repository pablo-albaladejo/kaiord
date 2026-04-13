/**
 * Editor Workflow Actions
 *
 * Transition functions for the editor-calendar integration:
 * accept (structured->ready), push (ready->pushed),
 * and modify (pushed->modified).
 */

import { useCallback } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import {
  transitionToModified,
  transitionToPushed,
  transitionToReady,
} from "../../application/workout-transitions";
import type { WorkoutRecord } from "../../types/calendar-record";
import type { KRD } from "../../types/krd";

async function persistRecord(record: WorkoutRecord) {
  await db.table("workouts").put(record);
}

export function useEditorActions(record: WorkoutRecord | undefined) {
  const acceptWorkout = useCallback(async () => {
    if (!record) return;
    const updated = transitionToReady(record);
    await persistRecord(updated);
  }, [record]);

  const pushWorkout = useCallback(
    async (garminPushId: string) => {
      if (!record) return;
      const updated = transitionToPushed(record, garminPushId);
      await persistRecord(updated);
    },
    [record]
  );

  const markModified = useCallback(
    async (krd: KRD) => {
      if (!record) return;
      const updated = transitionToModified(record, krd);
      await persistRecord(updated);
    },
    [record]
  );

  return { acceptWorkout, pushWorkout, markModified };
}
