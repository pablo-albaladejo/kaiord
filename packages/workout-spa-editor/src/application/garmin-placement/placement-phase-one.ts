/**
 * Phase 1 inside the lock: the governed library push (design §3.3 step 2).
 * `onLibraryConfirmed` fires iff the row then holds a confirmed library id.
 */
import type { GarminWorkoutId } from "../../types/garmin-ledger";
import { NoActiveExportRouteError } from "../export/execute-workout-push";
import type { RecordExportResult } from "../export/record-export.use-case";
import type { LedgerKey, PlacementDeps } from "./placement-deps";
import {
  failed,
  type PlacementResult,
  recordDeleted,
} from "./placement-result";
import type { Row } from "./placement-row";

export type PlacementRequest = {
  kaiordRecordId: string;
  /** The workout's calendar date, `YYYY-MM-DD`. */
  date: string;
  runLibraryPush: () => Promise<RecordExportResult>;
  onLibraryConfirmed?: (workoutId: GarminWorkoutId) => void;
  sendAnyway?: boolean;
  /** The run's result, for the owning caller only (never a joiner). */
  onSettled?: (result: PlacementResult) => void;
};

export type PhaseOne = { minted: boolean; row: Row } | PlacementResult;

export const runPhaseOne = async (
  deps: Pick<PlacementDeps, "ledgerRepo">,
  key: LedgerKey,
  request: PlacementRequest
): Promise<PhaseOne> => {
  let outcome: RecordExportResult["outcome"];
  try {
    outcome = (await request.runLibraryPush()).outcome;
  } catch (error) {
    return error instanceof NoActiveExportRouteError
      ? failed("no-export-route", false)
      : failed("library-push-failed", true);
  }
  if (outcome === "lost-race") return failed("busy", true);
  const row = await deps.ledgerRepo.findByNaturalKey(key);
  if (!row) return recordDeleted();
  if (row.library?.kind === "confirmed")
    request.onLibraryConfirmed?.(row.library.workoutId);
  return { minted: outcome === "created" || outcome === "updated", row };
};

export const isPhaseOneResult = (p: PhaseOne): p is PlacementResult =>
  "kind" in p;
