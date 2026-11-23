/**
 * Verify before delete (design §3.5): a drain deletes only right after it
 * has seen its `Placed` on Garmin, so a merge that crowns a dead `Placed`
 * cannot turn a drain into a gap (the §3.9 clock-skew counterexample). A
 * `Placed` proven absent (`readPlacedLive`) was deleted by someone: its id
 * turns `gone` and the row `uncertain`, in one guarded write — unless it is
 * this run's own POST, whose absence is a lagging read, never a death.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import { entryOf } from "../sync/merge-garmin-removal-queue";
import type { PlacementRun } from "./placement-deps";
import { readPlacedLive, type Scheduled } from "./placement-live-read";
import { decide, holdsPlaced, withEntries } from "./placement-row";

const markDead = (run: PlacementRun, placed: Scheduled) =>
  decide(run.deps, run.key, (row) => {
    if (!row || !holdsPlaced(row, placed)) return { verdict: undefined };
    const { workoutId, date } = placed;
    const dead = withEntries(row, [entryOf(placed, "gone")]);
    const placement = { kind: "uncertain", workoutId, date } as const;
    return { write: { ...dead, placement }, verdict: undefined };
  });

/** `true` only when a read shows the `Placed`'s own schedule id.
    `ownPost`: the `Placed` is this run's own ok POST. */
export const verifyPlaced = async (
  run: PlacementRun,
  placed: GarminPlaced,
  ownPost: boolean
): Promise<boolean> => {
  if (placed.kind !== "scheduled") return false;
  const read = await readPlacedLive(run, placed);
  if (read?.state === "absent" && !ownPost) await markDead(run, placed);
  return read?.state === "present";
};
