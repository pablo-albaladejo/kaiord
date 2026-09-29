/**
 * Verify before delete (design §3.5): a drain deletes only right after it
 * has seen its `Placed` on Garmin, so a merge that crowns a dead `Placed`
 * cannot turn a drain into a gap (the §3.9 clock-skew counterexample). A
 * `Placed` absent from two reads `SETTLE_MS` apart (A5 promises a new entry
 * only after that) was deleted by someone: its id turns `gone` and the row
 * `uncertain`, in one guarded write — unless it is this run's own POST,
 * whose absence is a lagging read, never a death. A failed read, an
 * id-less entry on the `Placed`'s date, A3 false or an `unconfirmed`
 * `Placed` (no id to see) verifies nothing.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import { entryOf } from "../sync/merge-garmin-removal-queue";
import { provesAbsent } from "./placement-absence";
import type { PlacementRun } from "./placement-deps";
import { decide, holdsPlaced, withEntries } from "./placement-row";
import { SETTLE_MS } from "./placement-timing";

type Scheduled = GarminPlaced & { kind: "scheduled" };

const markDead = (run: PlacementRun, placed: Scheduled) =>
  decide(run.deps, run.key, (row) => {
    if (!row || !holdsPlaced(row, placed)) return { verdict: undefined };
    const { workoutId, date } = placed;
    const dead = withEntries(row, [entryOf(placed, "gone")]);
    const placement = { kind: "uncertain", workoutId, date } as const;
    return { write: { ...dead, placement }, verdict: undefined };
  });

const readPlaced = async (run: PlacementRun, placed: Scheduled) => {
  const read = await run.deps.calendar.find(placed.workoutId, placed.date);
  if (!read.ok) return "unknown";
  const id = placed.workoutScheduleId;
  if (read.entries.some((e) => e.workoutScheduleId === id)) return "seen";
  return provesAbsent(read.entries, id, placed.date) ? "absent" : "unknown";
};

/** `true` only when a read shows the `Placed`'s own schedule id.
    `ownPost`: the `Placed` is this run's own ok POST. */
export const verifyPlaced = async (
  run: PlacementRun,
  placed: GarminPlaced,
  ownPost: boolean
): Promise<boolean> => {
  const { canFind, scheduleIdsInFind } = run.deps;
  if (placed.kind !== "scheduled" || !canFind || !scheduleIdsInFind)
    return false;
  const first = await readPlaced(run, placed);
  if (first !== "absent") return first === "seen";
  await run.deps.sleep(SETTLE_MS);
  const second = await readPlaced(run, placed);
  if (second === "absent" && !ownPost) await markDead(run, placed);
  return second === "seen";
};
