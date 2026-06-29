/**
 * Persist an imported KRD as a new WorkoutRecord on a specific date.
 *
 * Used by `ImportDropzoneOverlay` when mounted with `?date=` so the
 * resulting workout lands on the calendar day the user picked. When
 * `?date=` is absent, the overlay does NOT call this — header-entry
 * imports stay non-persisting (consistent with the prior behaviour).
 */

import type { PersistencePort } from "../../../ports/persistence-port";
import {
  createStructuredWorkoutRecord,
  type WorkoutRecord,
} from "../../../types/calendar-record";
import type { KRD } from "../../../types/krd";

export type PersistImportedInput = {
  krd: KRD;
  date: string;
  profileId: string;
  sport: string;
};

export async function persistImportedWorkout(
  persistence: PersistencePort,
  input: PersistImportedInput
): Promise<WorkoutRecord> {
  const record = createStructuredWorkoutRecord({
    profileId: input.profileId,
    date: input.date,
    sport: input.sport,
    source: "kaiord",
    krd: input.krd,
    tags: [],
    raw: null,
  });
  await persistence.workouts.put(record);
  return record;
}
