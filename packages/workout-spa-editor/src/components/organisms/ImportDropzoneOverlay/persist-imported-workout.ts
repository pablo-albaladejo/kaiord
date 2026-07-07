/**
 * Persist an imported KRD on a specific calendar date.
 *
 * Used by `ImportDropzoneOverlay` when mounted with `?date=` so the
 * resulting record lands on the calendar day the user picked. When
 * `?date=` is absent, the overlay does NOT call this — header-entry
 * imports stay non-persisting (consistent with the prior behaviour).
 */

import { deriveExternalId } from "@kaiord/core";

import { stampProvenance } from "../../../application/import/stamp-provenance";
import type { PersistencePort } from "../../../ports/persistence-port";
import {
  type ActivityRecord,
  buildActivityRecord,
} from "../../../types/activity-record";
import {
  createStructuredWorkoutRecord,
  type WorkoutRecord,
} from "../../../types/calendar-record";
import type { KRD } from "../../../types/krd";
import { classifyImportedKrd } from "../../../utils/classify-imported-krd";

const FIT_IMPORT_SOURCE = "fit-import";

export type PersistImportedInput = {
  krd: KRD;
  date: string;
  profileId: string;
  sport: string;
};

export type PersistImportedResult =
  | { kind: "workout"; workout: WorkoutRecord }
  | { kind: "activity"; activity: ActivityRecord };

const persistActivity = async (
  persistence: PersistencePort,
  input: PersistImportedInput
): Promise<ActivityRecord> => {
  const externalId = deriveExternalId({
    payload: input.krd as unknown as Record<string, unknown>,
    measuredAt: input.krd.metadata.created,
  });
  const provenance = stampProvenance(FIT_IMPORT_SOURCE, externalId);
  const activity = buildActivityRecord({
    profileId: input.profileId,
    date: input.date,
    sport: input.sport,
    sourceBridgeId: provenance.sourceBridgeId,
    externalId: provenance.externalId,
    linkedWorkoutId: null,
    krd: input.krd,
  });
  await persistence.activities.upsertByExternalId(activity);
  return activity;
};

export async function persistImportedWorkout(
  persistence: PersistencePort,
  input: PersistImportedInput
): Promise<PersistImportedResult> {
  // A file classified as an executed activity (records/laps) is persisted as a
  // first-class `activity` row only — the calendar renders it natively (F5
  // GATE A1), deduped by fit-import provenance + content-hash externalId.
  // A structured workout with no execution stays a library WorkoutRecord.
  if (classifyImportedKrd(input.krd).kind === "activity") {
    return {
      kind: "activity",
      activity: await persistActivity(persistence, input),
    };
  }
  const workout = createStructuredWorkoutRecord({
    profileId: input.profileId,
    date: input.date,
    sport: input.sport,
    source: "kaiord",
    krd: input.krd,
    tags: [],
    raw: null,
  });
  await persistence.workouts.put(workout);
  return { kind: "workout", workout };
}
