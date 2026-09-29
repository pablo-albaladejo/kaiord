import {
  type PlacementNotice,
  placementNotice,
} from "../application/garmin-placement/placement-notice";
import type { PlacementResult } from "../application/garmin-placement/placement-result";
import { placementLockName } from "../application/garmin-placement/record-lock-port";
import { usePlacementOutcome } from "../contexts/placement-outcome-context";
import type { ExportLedgerEntry } from "../types/export-ledger";
import { useRecordLockHeld } from "./use-record-lock-held";

export type GarminPlacementNotice = PlacementNotice & {
  /** Records the last run's outcome for this record. */
  setLastRun: (result: PlacementResult | undefined) => void;
};

/**
 * The record's placement notice: its ledger row, which the page reads in
 * its own live query (one query per page), joined with the last run's
 * ephemeral outcome. A posted attempt is watched through the record's
 * lock, so a live run is never shown as an `uncertain` to answer.
 */
export const useGarminPlacementNotice = (
  recordId: string | undefined,
  row: ExportLedgerEntry | undefined
): GarminPlacementNotice => {
  const [lastRun, setLastRun] = usePlacementOutcome(recordId);
  const p = row?.placement;
  const posted = recordId && p?.kind === "attempting" && p.posted ? p : null;
  const inFlight = useRecordLockHeld(
    posted ? placementLockName(recordId!) : undefined,
    `${posted?.at}:${lastRun?.kind}`
  );
  return { ...placementNotice(row, lastRun, inFlight), setLastRun };
};
