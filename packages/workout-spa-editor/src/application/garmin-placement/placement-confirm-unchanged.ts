/**
 * The live state is read before "nothing to do" is decided: a `scheduled`
 * `Placed` equal to the desired placement counts as unchanged only while
 * Garmin still shows its schedule id. Absent from two reads `SETTLE_MS`
 * apart (the athlete deleted it in Garmin), its id turns `gone` and the
 * placement is cleared in one guarded write, so the claim that follows
 * places the Workout again: one entry, never zero. A failed read, an
 * id-less entry on the date, A3 false or an `unconfirmed` `Placed` proves
 * nothing, and the placement stands.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import { entryOf } from "../sync/merge-garmin-removal-queue";
import type { PlacementRun } from "./placement-deps";
import { decide, holdsPlaced, type Row, withEntries } from "./placement-row";
import { SETTLE_MS } from "./placement-timing";
import { readPlaced } from "./placement-verify-placed";

type Scheduled = GarminPlaced & { kind: "scheduled" };

const clearDead = async (run: PlacementRun, placed: Scheduled) =>
  (
    await decide(run.deps, run.key, (row) => {
      if (!row || !holdsPlaced(row, placed))
        return { verdict: "live" as const };
      const cleared: Row = { ...withEntries(row, [entryOf(placed, "gone")]) };
      delete cleared.placement;
      return { write: cleared, verdict: "gone" as const };
    })
  ).verdict;

/** `gone`: the `Placed` was proven absent and cleared; place it again. */
export const confirmUnchanged = async (
  run: PlacementRun,
  placed: GarminPlaced
): Promise<"live" | "gone"> => {
  const { canFind, scheduleIdsInFind } = run.deps;
  if (placed.kind !== "scheduled" || !canFind || !scheduleIdsInFind)
    return "live";
  if ((await readPlaced(run, placed)) !== "absent") return "live";
  await run.deps.sleep(SETTLE_MS);
  if ((await readPlaced(run, placed)) !== "absent") return "live";
  return clearDead(run, placed);
};
