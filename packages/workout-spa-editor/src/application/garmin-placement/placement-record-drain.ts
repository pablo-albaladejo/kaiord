/**
 * One drain outcome, written as its own entry's state on the re-read row
 * (join by max: concurrent queue additions survive). After
 * `MAX_DELETE_ATTEMPTS` failed sends the entry is `abandoned`.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import type { PlacementRun } from "./placement-deps";
import { decide, holdsPlaced, withEntries } from "./placement-row";
import { MAX_DELETE_ATTEMPTS } from "./placement-timing";

/** Writes one entry's outcome; `false` when the guard no longer holds. */
export const recordDrain = async (
  run: PlacementRun,
  guard: GarminPlaced,
  id: string,
  outcome: "gone" | "count"
) =>
  (
    await decide(run.deps, run.key, (row) => {
      const cur = row?.removalQueue?.find((e) => e.workoutScheduleId === id);
      if (!row || !cur || !holdsPlaced(row, guard)) return { verdict: false };
      const attempts = cur.attempts + 1;
      const next: GarminRemovalEntry =
        outcome === "gone"
          ? { ...cur, state: "gone" }
          : { ...cur, attempts, abandoned: attempts >= MAX_DELETE_ATTEMPTS };
      return { write: withEntries(row, [next]), verdict: true };
    })
  ).verdict;
