/**
 * One persisted workout through the placement pipeline: export its GCN,
 * push and place it, and — when Garmin confirmed the library workout id —
 * re-read the record and persist that id (`recordGarminPush`). Shared by the
 * chat tool (`doPushToGarmin`) and the bulk "Send week" runner, so both
 * record a push the same way. A missing record is `record-deleted`.
 */
import {
  type PlacementResult,
  recordDeleted,
} from "../application/garmin-placement/placement-result";
import {
  type PlacementPipelineDeps,
  pushWorkoutToGarminCalendar,
} from "../application/garmin-placement/push-workout-to-garmin-calendar";
import { recordGarminPush } from "../application/record-garmin-push";
import type { GarminPushOutcome } from "../contexts/garmin-bridge-types";
import type { PersistencePort } from "../ports/persistence-port";
import { exportGcnWorkout } from "../utils/export-workout-formats";
import { garminPlacementRequest } from "./garmin-placement-request";

export type PlacedRecord = {
  result: PlacementResult;
  /** The confirmed Garmin workout id, persisted as the push id. */
  garminPushId: string | null;
};

export const placeRecord = async (
  persistence: PersistencePort,
  pushWorkout: (gcn: unknown) => Promise<GarminPushOutcome>,
  workoutId: string,
  placementDeps: PlacementPipelineDeps
): Promise<PlacedRecord | undefined> => {
  const record = await persistence.workouts.getById(workoutId);
  if (!record?.krd) return undefined;
  const gcn = await exportGcnWorkout(record.krd);
  const confirmed: { id?: string } = {};
  const result = await pushWorkoutToGarminCalendar(
    placementDeps,
    garminPlacementRequest(
      { record, gcn, ledgerRepo: placementDeps.ledgerRepo, pushWorkout },
      { onLibraryConfirmed: (id) => (confirmed.id = id) }
    )
  );
  const garminPushId = confirmed.id ?? null;
  if (garminPushId !== null) {
    // Re-read so edits made while the push was in flight are kept.
    const fresh = await persistence.workouts.getById(workoutId);
    await persistence.workouts.put(
      recordGarminPush(fresh ?? record, garminPushId)
    );
  }
  return { result, garminPushId };
};

/** The bulk runner's `pushOne`: a vanished workout is `record-deleted`. */
export const placeRecordResult = async (
  ...args: Parameters<typeof placeRecord>
): Promise<PlacementResult> =>
  (await placeRecord(...args))?.result ?? recordDeleted();
