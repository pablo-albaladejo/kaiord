/**
 * What the editor shows about a record's Garmin placement (design §3.8):
 * `uncertain` and the dismissable entries are facts of the persisted ledger
 * row, so the row decides them — a row that is no longer `uncertain` never
 * shows one. An ambiguous POST stays `attempting{posted:true}`; with no run
 * holding the record's lock, that is the athlete's `uncertain` to answer
 * once its gate passes (`sendAfter`). The last run's outcome (`failed`,
 * `library-only`, a plain success) is ephemeral and fills the rest.
 */
import { isGarminPlaced } from "../../types/garmin-ledger";
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import { dismissableEntries } from "./placement-dismiss";
import { gateOf } from "./placement-resolve";
import type { PlacementResult } from "./placement-result";
import { canConfirmAt, type Row } from "./placement-row";

export type PlacementNotice = {
  result?: PlacementResult;
  /** Abandoned entries the athlete may say they removed. */
  removable: GarminRemovalEntry[];
};

/** The results whose message states the workout's own date. */
const namesWorkoutDate = (result: PlacementResult): boolean =>
  result.kind === "scheduled" ||
  result.kind === "moved" ||
  result.kind === "unchanged" ||
  result.kind === "duplicate-left";

/**
 * The last run, while it still describes the workout: a result naming the
 * workout's date is dropped once the workout's date is no longer the one
 * the run placed, or once the ledger holds the workout on another date (a
 * later send, such as Send week, placed it elsewhere).
 */
export const currentRun = <
  R extends { result: PlacementResult; date?: string },
>(
  run: R | undefined,
  workoutDate: string | undefined,
  row?: Row
): R | undefined => {
  if (!run || !namesWorkoutDate(run.result)) return run;
  const placed = row?.placement;
  const placedElsewhere = isGarminPlaced(placed) && placed.date !== run.date;
  return run.date !== workoutDate || placedElsewhere ? undefined : run;
};

export const placementNotice = (
  row: Row | undefined,
  lastRun: PlacementResult | undefined,
  runInFlight = false
): PlacementNotice => {
  const removable = dismissableEntries(row);
  const p = row?.placement;
  const open = p?.kind === "attempting" && p.posted && !runInFlight;
  if (p?.kind === "uncertain" || open) {
    const canConfirm = canConfirmAt(row, p.workoutId, p.date);
    const gate = p.kind === "attempting" ? { sendAfter: gateOf(p) } : {};
    return {
      result: { kind: "uncertain", date: p.date, canConfirm, ...gate },
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
