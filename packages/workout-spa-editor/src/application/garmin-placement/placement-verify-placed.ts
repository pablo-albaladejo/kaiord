/**
 * Verify before delete (design §3.5): a drain deletes only behind a `Placed`
 * it has just seen on Garmin, so every delete leaves a live entry whatever
 * a merge chose (the §3.9 clock-skew counterexample). A `Placed` the read
 * shows absent was deleted by someone: its id turns `gone` and the row
 * `uncertain`, in one guarded write. A failed or id-less read, A3 false or
 * an `unconfirmed` `Placed` (no id to see) verifies nothing.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import { entryOf } from "../sync/merge-garmin-removal-queue";
import type { PlacementRun } from "./placement-deps";
import { decide, holdsPlaced, withEntries } from "./placement-row";

type Scheduled = GarminPlaced & { kind: "scheduled" };

const markDead = (run: PlacementRun, placed: Scheduled) =>
  decide(run.deps, run.key, (row) => {
    if (!row || !holdsPlaced(row, placed)) return { verdict: undefined };
    const { workoutId, date } = placed;
    const dead = withEntries(row, [entryOf(placed, "gone")]);
    const placement = { kind: "uncertain", workoutId, date } as const;
    return { write: { ...dead, placement }, verdict: undefined };
  });

/** `true` only when the read shows the `Placed`'s own schedule id. */
export const verifyPlaced = async (
  run: PlacementRun,
  placed: GarminPlaced
): Promise<boolean> => {
  const { canFind, scheduleIdsInFind, calendar } = run.deps;
  if (placed.kind !== "scheduled" || !canFind || !scheduleIdsInFind)
    return false;
  const read = await calendar.find(placed.workoutId, placed.date);
  if (!read.ok) return false;
  const ids = read.entries.map((e) => e.workoutScheduleId);
  if (ids.includes(placed.workoutScheduleId)) return true;
  if (ids.every(Boolean)) await markDead(run, placed);
  return false;
};
