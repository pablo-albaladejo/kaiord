/**
 * The live state is read before "nothing to do" is decided: a `scheduled`
 * `Placed` equal to the desired placement counts as unchanged only while
 * Garmin still shows its schedule id. Absent from two reads `SETTLE_MS`
 * apart (the athlete deleted it in Garmin), its id turns `gone` and the
 * placement is cleared in one guarded write, so the claim that follows
 * places the Workout again: one entry, never zero. Seen, any other entry
 * of Kaiord's own on its date that the record holds `gone` (a read had left
 * it out, and a second one was posted) is revived as a surplus to drain, so
 * one entry remains. A read that proves nothing leaves the placement as is.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import { entryOf } from "../sync/merge-garmin-removal-queue";
import type { CalendarEntry } from "./garmin-calendar-port";
import type { PlacementRun } from "./placement-deps";
import { readPlacedLive, type Scheduled } from "./placement-live-read";
import { revivable, revived } from "./placement-revival";
import { decide, holdsPlaced, type Row, withEntries } from "./placement-row";

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

const reviveSurplus = (
  run: PlacementRun,
  placed: Scheduled,
  found: readonly CalendarEntry[]
) =>
  decide(run.deps, run.key, (row) => {
    if (!row || !holdsPlaced(row, placed)) return { verdict: undefined };
    const surplus = revivable(row, placed.workoutId, placed.date, found)
      .filter((e) => e.workoutScheduleId !== placed.workoutScheduleId)
      .map((e) => revived(e, "retire"));
    if (surplus.length === 0) return { verdict: undefined };
    return { write: withEntries(row, surplus), verdict: undefined };
  });

/** `gone`: the `Placed` was proven absent and cleared; place it again. */
export const confirmUnchanged = async (
  run: PlacementRun,
  placed: GarminPlaced
): Promise<"live" | "gone"> => {
  if (placed.kind !== "scheduled") return "live";
  const read = await readPlacedLive(run, placed);
  if (read?.state === "absent") return clearDead(run, placed);
  if (read?.state === "present") await reviveSurplus(run, placed, read.entries);
  return "live";
};
