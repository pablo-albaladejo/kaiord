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
import { buildActivityRecord } from "../../../types/activity-record";
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

const persistActivity = async (
  persistence: PersistencePort,
  input: PersistImportedInput
): Promise<void> => {
  const externalId = deriveExternalId({
    payload: input.krd as unknown as Record<string, unknown>,
    measuredAt: input.krd.metadata.created,
  });
  const provenance = stampProvenance(FIT_IMPORT_SOURCE, externalId);
  await persistence.activities.upsertByExternalId(
    buildActivityRecord({
      profileId: input.profileId,
      date: input.date,
      sport: input.sport,
      sourceBridgeId: provenance.sourceBridgeId,
      externalId: provenance.externalId,
      krd: input.krd,
    })
  );
};

export async function persistImportedWorkout(
  persistence: PersistencePort,
  input: PersistImportedInput
): Promise<WorkoutRecord> {
  // Transitional dual-write (F0 step 0.5): a file classified as an executed
  // activity is persisted as a first-class `activity` row (fit-import
  // provenance + content-hash externalId, deduped) AND — for now — as a
  // WorkoutRecord so the calendar/library keep rendering it unchanged. The
  // WorkoutRecord is TRANSITIONAL: it retires once the calendar consumes
  // `activities` natively (plan follow-up, F5/V2). Structured workouts write
  // only the WorkoutRecord.
  if (classifyImportedKrd(input.krd).kind === "activity") {
    await persistActivity(persistence, input);
  }
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
