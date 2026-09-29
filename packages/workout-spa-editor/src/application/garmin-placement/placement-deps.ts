import type { GarminWorkoutId } from "../../types/garmin-ledger";
import type { ExportLedgerRepository } from "../export/export-ledger-repository.port";
import type { GarminCalendarPort } from "./garmin-calendar-port";

export type LedgerKey = {
  kaiordRecordId: string;
  destinationBridgeId: string;
};

export type PlacementDeps = {
  ledgerRepo: ExportLedgerRepository;
  calendar: GarminCalendarPort;
  /** The bridge reports `calendar-find-v1`. */
  canFind: boolean;
  /** A3: `calendar-find` exposes schedule ids (`SCHEDULE_IDS_IN_FIND`). */
  scheduleIdsInFind: boolean;
  /** Epoch milliseconds. */
  now: () => number;
  sleep: (ms: number) => Promise<void>;
};

export type Desired = { workoutId: GarminWorkoutId; date: string };

/** One placement run inside the record's lock. */
export type PlacementRun = {
  deps: PlacementDeps;
  key: LedgerKey;
  desired: Desired;
  /** The library id was minted by this run's Phase 1 (created / updated). */
  minted: boolean;
  /** The athlete chose "Send anyway" on an `uncertain`. */
  sendAnyway: boolean;
};

export const isoAt = (ms: number) => new Date(ms).toISOString();
