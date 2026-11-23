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
import { type PlacedEntries, placedRow } from "./placement-placed-row";
import { type Attempt, decide, isAttemptAt, type Row } from "./placement-row";

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

/** A revival the re-read row already holds deleted (a merge brought it in
    since the read): the read that showed the entry was stale. */
const staleRevival = (row: Row, { own }: PlacedEntries) =>
  own?.revival !== undefined &&
  (row.removalQueue ?? []).some(
    (e) => e.workoutScheduleId === own.workoutScheduleId && e.deleted
  );

/** Writes `placed` for `attempt`; `absent` when the workout was deleted,
    `stale` when the revival it carries is of an entry seen deleted. */
export const commitPlacement = async (
  run: PlacementRun,
  attempt: Attempt,
  placed: GarminPlaced,
  written: Row | undefined,
  entries: PlacedEntries = {}
): Promise<"committed" | "absent" | "stale"> => {
  const now = isoAt(run.deps.now());
  const { verdict } = await decide(run.deps, run.key, (row) => {
    if (!row) return { verdict: "absent" as const };
    if (staleRevival(row, entries)) return { verdict: "stale" as const };
    if (isAttemptAt(row, attempt.at))
      return {
        write: placedRow(row, placed, attempt.previous, entries),
        verdict: "committed" as const,
      };
    const ours = placedRow(written ?? row, placed, attempt.previous, entries);
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
