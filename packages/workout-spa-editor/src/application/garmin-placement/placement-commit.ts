/**
 * Step 7 (design §3.3) and the rollback of a definite failure. The commit
 * writes the new `Placed` (`keep`) and retires a superseded `scheduled`
 * previous in one guarded write; when another writer changed the row after
 * a successful POST, ours is merged in as the other row.
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";
import type { GarminPlaced, GarminScheduleId } from "../../types/garmin-ledger";
import { mergeGarminLedgerRows } from "../sync/merge-garmin-ledger-rows";
import { isoAt, type PlacementRun } from "./placement-deps";
import {
  type Attempt,
  decide,
  isAttemptAt,
  placedRow,
  type Row,
} from "./placement-row";

export const placedFrom = (
  attempt: Attempt,
  id: GarminScheduleId | null
): GarminPlaced =>
  id
    ? {
        kind: "scheduled",
        workoutScheduleId: id,
        workoutId: attempt.workoutId,
        date: attempt.date,
      }
    : {
        kind: "unconfirmed",
        workoutId: attempt.workoutId,
        date: attempt.date,
        supersedes: attempt.supersedes,
      };

/** Writes `placed` for `attempt`; `absent` when the workout was deleted. */
export const commitPlacement = async (
  run: PlacementRun,
  attempt: Attempt,
  placed: GarminPlaced,
  written: Row | undefined
): Promise<"committed" | "absent"> => {
  const now = isoAt(run.deps.now());
  const { verdict } = await decide(run.deps, run.key, (row) => {
    if (!row) return { verdict: "absent" as const };
    if (isAttemptAt(row, attempt.at))
      return {
        write: placedRow(row, placed, attempt.previous),
        verdict: "committed" as const,
      };
    const ours = placedRow(written ?? row, placed, attempt.previous);
    return {
      // Two ledger rows merge into a ledger row; the hook is untyped.
      write: mergeGarminLedgerRows(row, {
        ...ours,
        updatedAt: now,
      }) as ExportLedgerEntry,
      verdict: "committed" as const,
    };
  });
  return verdict;
};
