/**
 * The placement request of a persisted workout: its calendar date and the
 * governed library push (`executeWorkoutPush`) as Phase 1, on the same
 * ledger the placement runs on. Shared by `useGarminPush` and the chat
 * tool's `doPushToGarmin`.
 */
import { executeWorkoutPush } from "../application/export/execute-workout-push";
import type { ExportLedgerRepository } from "../application/export/export-ledger-repository.port";
import type { PlacementRequest } from "../application/garmin-placement/push-workout-to-garmin-calendar";
import type { GarminPushOutcome } from "../contexts/garmin-bridge-types";
import type { WorkoutRecord } from "../types/calendar-record";
import {
  buildGarminPushFn,
  GARMIN_BRIDGE_ID,
  policyRepo,
} from "./garmin-push-fn";

export type GarminPlacementInput = {
  record: WorkoutRecord;
  /** The workout's GCN export (`exportGcnWorkout`). */
  gcn: unknown;
  ledgerRepo: ExportLedgerRepository;
  pushWorkout: (gcn: unknown) => Promise<GarminPushOutcome>;
};

export const garminPlacementRequest = (
  { record, gcn, ledgerRepo, pushWorkout }: GarminPlacementInput,
  extra: Partial<PlacementRequest> = {}
): PlacementRequest => ({
  kaiordRecordId: record.id,
  date: record.date,
  runLibraryPush: () =>
    executeWorkoutPush(
      { policyRepo, ledgerRepo },
      {
        profileId: record.profileId,
        kaiordRecordId: record.id,
        destinationBridgeId: GARMIN_BRIDGE_ID,
        payload: gcn as Record<string, unknown>,
        pushFn: buildGarminPushFn(pushWorkout),
      }
    ),
  ...extra,
});
