/**
 * One persisted workout through the placement pipeline: export its GCN,
 * push and place it, and — when Garmin confirmed the library workout id —
 * re-read the record and persist that id (`recordGarminPush`). Shared by the
 * chat tool (`doPushToGarmin`) and the bulk "Send week" runner, so both
 * record a push the same way. A missing record is `record-deleted`.
 */
import type { BulkItemResult } from "../application/garmin-bulk/send-week-to-garmin";
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
import { garminPlacementRequest } from "./garmin-placement-request";
import { exportRecordGcn } from "./garmin-record-gcn";

export type PlacedRecord = {
  result: PlacementResult;
  /** The confirmed Garmin workout id, persisted as the push id. */
  garminPushId: string | null;
  /** The workout date placed: the record's date when its turn came. */
  date: string;
};

export const placeRecord = async (
  persistence: PersistencePort,
  pushWorkout: (gcn: unknown) => Promise<GarminPushOutcome>,
  workoutId: string,
  placementDeps: PlacementPipelineDeps
): Promise<PlacedRecord | undefined> => {
  const record = await persistence.workouts.getById(workoutId);
  if (!record?.krd) return undefined;
  const { krd, profileId } = record;
  const buildGcn = () => exportRecordGcn(krd, profileId, persistence.profiles);
  const confirmed: { id?: string } = {};
  const result = await pushWorkoutToGarminCalendar(
    placementDeps,
    garminPlacementRequest(
      {
        record,
        buildGcn,
        ledgerRepo: placementDeps.ledgerRepo,
        pushWorkout,
      },
      { onLibraryConfirmed: (id) => (confirmed.id = id) }
    )
  );
  const garminPushId = confirmed.id ?? null;
  if (garminPushId !== null)
    // Re-read and write in one transaction, so a concurrent writer's fields
    // (a coach move's date) are kept. A workout deleted meanwhile stays so.
    await persistence.transaction(async () => {
      const fresh = await persistence.workouts.getById(workoutId);
      if (fresh)
        await persistence.workouts.put(recordGarminPush(fresh, garminPushId));
    });
  return { result, garminPushId, date: record.date };
};

/** The bulk runner's `pushOne`: the result with the date placed; a
    vanished workout is `record-deleted`. */
export const placeRecordResult = async (
  ...args: Parameters<typeof placeRecord>
): Promise<BulkItemResult> => {
  const placed = await placeRecord(...args);
  return placed
    ? { result: placed.result, date: placed.date }
    : { result: recordDeleted() };
};
