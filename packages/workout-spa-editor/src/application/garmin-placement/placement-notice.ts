/**
 * What the editor shows about a record's Garmin placement (design §3.8):
 * `uncertain` and the dismissable entries are facts of the persisted ledger
 * row, so the row decides them — a row that is no longer `uncertain` never
 * shows one. The last run's outcome (`failed`, `library-only`, a plain
 * success) is ephemeral and fills the rest.
 */
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import { dismissableEntries } from "./placement-dismiss";
import type { PlacementResult } from "./placement-result";
import { canConfirmAt, type Row } from "./placement-row";

export type PlacementNotice = {
  result?: PlacementResult;
  /** Abandoned entries the athlete may say they removed. */
  removable: GarminRemovalEntry[];
};

export const placementNotice = (
  row: Row | undefined,
  lastRun: PlacementResult | undefined
): PlacementNotice => {
  const removable = dismissableEntries(row);
  const p = row?.placement;
  if (p?.kind === "uncertain") {
    const canConfirm = canConfirmAt(row, p.workoutId, p.date);
    return {
      result: { kind: "uncertain", date: p.date, canConfirm },
      removable,
    };
  }
  if (lastRun && lastRun.kind !== "uncertain")
    return { result: lastRun, removable };
  if (removable.length > 0) {
    const dates = removable.map((e) => e.date);
    return { result: { kind: "duplicate-left", dates }, removable };
  }
  return { removable };
};
