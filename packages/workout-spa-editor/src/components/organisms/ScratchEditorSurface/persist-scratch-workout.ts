/**
 * Persist a scratch-authored KRD as a new WorkoutRecord on a specific date.
 *
 * Mirrors `ImportDropzoneOverlay/persist-imported-workout.ts`, differing
 * only in `source: "scratch"`. The scratch surface fires this on an
 * explicit "Save & schedule" click so the workout lands on the calendar
 * day the user picked. Mount stays side-effect-free.
 *
 * NOTE: does NOT call stripIds — `persistence.workouts.put` strips krd ids
 * at the Dexie adapter boundary (dexie-workout-repository.ts:43-44).
 */

import type { PersistencePort } from "../../../ports/persistence-port";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { KRD } from "../../../types/krd";
import { isValidCalendarDate } from "../../../utils/is-valid-calendar-date";

export type PersistScratchInput = {
  krd: KRD;
  date: string;
  profileId: string;
  sport: string;
};

export async function persistScratchWorkout(
  persistence: PersistencePort,
  input: PersistScratchInput
): Promise<WorkoutRecord> {
  // Guard the calendar-date invariant at the persist boundary (D6): a caller
  // that bypasses UI validation must not be able to schedule an impossible date.
  if (!isValidCalendarDate(input.date)) {
    throw new Error("Cannot persist scratch workout: invalid calendar date");
  }
  const now = new Date().toISOString();
  const record: WorkoutRecord = {
    id: crypto.randomUUID(),
    profileId: input.profileId,
    date: input.date,
    sport: input.sport,
    source: "scratch",
    sourceId: null,
    planId: null,
    state: "structured",
    raw: null,
    krd: input.krd,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: now,
    modifiedAt: null,
    updatedAt: now,
  };
  await persistence.workouts.put(record);
  return record;
}
