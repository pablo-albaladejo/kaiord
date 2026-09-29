import { useCallback } from "react";

import {
  currentRun,
  type PlacementNotice,
  placementNotice,
} from "../application/garmin-placement/placement-notice";
import type { PlacementResult } from "../application/garmin-placement/placement-result";
import { placementLockName } from "../application/garmin-placement/record-lock-port";
import { usePlacementOutcome } from "../contexts/placement-outcome-context";
import type { ExportLedgerEntry } from "../types/export-ledger";
import { useRecordLockHeld } from "./use-record-lock-held";

export type GarminPlacementNotice = PlacementNotice & {
  /** The workout date the shown run placed. */
  placedDate?: string;
  /** Records the last run's outcome for this record, with the workout
      date it ran for. */
  setLastRun: (result: PlacementResult | undefined, date?: string) => void;
};

/**
 * The record's placement notice: its ledger row, which the page reads in
 * its own live query (one query per page), joined with the last run's
 * ephemeral outcome. A posted attempt is watched through the record's
 * lock, so a live run is never shown as an `uncertain` to answer. A run
 * that placed another date than the workout's, or than the ledger's, is
 * not shown.
 */
export const useGarminPlacementNotice = (
  recordId: string | undefined,
  row: ExportLedgerEntry | undefined,
  workoutDate: string | undefined
): GarminPlacementNotice => {
  const [lastRun, setOutcome] = usePlacementOutcome(recordId);
  const run = currentRun(lastRun, workoutDate, row);
  const p = row?.placement;
  const posted = recordId && p?.kind === "attempting" && p.posted ? p : null;
  const inFlight = useRecordLockHeld(
    posted ? placementLockName(recordId!) : undefined,
    `${posted?.at}:${lastRun?.result.kind}`
  );
  const setLastRun = useCallback(
    (result: PlacementResult | undefined, date?: string) =>
      setOutcome(result && { result, date }),
    [setOutcome]
  );
  return {
    ...placementNotice(row, run?.result, inFlight),
    placedDate: run?.date,
    setLastRun,
  };
};
