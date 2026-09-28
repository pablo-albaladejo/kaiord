/**
 * The placement half of `mergeGarminLedgerRows` (MUST-D): supersession beats
 * the clock. `newer` / `older` come from the ledger total order, so the
 * result never depends on argument order. Pure, no I/O.
 *
 * Invariants:
 * - Only a `Placed` whose id is `keep` (or absent) can win; a `held`,
 *   `retire` or `gone` id never does, and neither does an `unconfirmed`
 *   Placed that may be such an entry (same workout, same date).
 * - A superseded `scheduled` loser is written `retire`, the winner `keep`;
 *   no state is ever lowered and no entry removed.
 * - When no `Placed` is free, an in-flight `attempting` / `uncertain` of
 *   either row survives; failing that the merge is `uncertain`. No state
 *   changes: nothing drainable is added, so no drain can leave a gap.
 * - A superseded `unconfirmed` Placed has no id to retire and is dropped:
 *   the worst case is an untracked duplicate, never a gap.
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";
import {
  type GarminPlaced,
  type GarminPlacement,
  isGarminPlaced,
} from "../../types/garmin-ledger";
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import {
  entryOf,
  isTainted,
  joinQueues,
  type Queue,
  raise,
  sortedQueue,
  uncertainTarget,
} from "./merge-garmin-removal-queue";

type Ledger = ExportLedgerEntry;
type Merged = { placement?: GarminPlacement; queue: GarminRemovalEntry[] };

const placedOf = (row: Ledger) =>
  isGarminPlaced(row.placement) ? row.placement : undefined;
const inFlightOf = (row: Ledger) =>
  isGarminPlaced(row.placement) ? undefined : row.placement;

/** Same calendar entry: same schedule id, or — when either side has no id
    (`unconfirmed`) — the same library workout on the same date. */
const sameEntry = (x: GarminPlaced, y: GarminPlaced) =>
  x.kind === "scheduled" && y.kind === "scheduled"
    ? x.workoutScheduleId === y.workoutScheduleId
    : x.workoutId === y.workoutId && x.date === y.date;

/** Neither row is placed: keep an in-flight state, `posted: true` and
    `uncertain` (either may exist on Garmin) over `posted: false`. */
const pickInFlight = (n?: GarminPlacement, o?: GarminPlacement) => {
  const rank = (p?: GarminPlacement) =>
    !p ? 0 : p.kind === "attempting" && !p.posted ? 1 : 2;
  return rank(o) > rank(n) ? o : n;
};

/** Picks the merged placement; raises the loser to `retire` in `queue`. */
const choose = (newer: Ledger, older: Ledger, queue: Queue) => {
  const placed = [placedOf(newer), placedOf(older)];
  const [candN, candO] = placed.map((p) =>
    p && !isTainted(p, queue) ? p : undefined
  );
  if (candN && candO && sameEntry(candN, candO)) {
    // One entry seen twice: keep the side that knows its schedule id.
    const olderKnowsMore =
      candO.kind === "scheduled" && candN.kind !== "scheduled";
    return olderKnowsMore ? candO : candN;
  }
  // Two different entries: the newer row's wins and the older one retires.
  if (candN) {
    if (candO?.kind === "scheduled") raise(queue, entryOf(candO, "retire"));
    return candN;
  }
  if (candO) return candO;
  // No Placed can be trusted: keep an in-flight state if either row has one,
  // else every Placed present may be dead or superseded — uncertain, with
  // nothing new to drain.
  const inFlight = pickInFlight(inFlightOf(newer), inFlightOf(older));
  return (
    inFlight ?? (placed.some(Boolean) ? uncertainTarget(queue) : undefined)
  );
};

export function mergeGarminPlacement(newer: Ledger, older: Ledger): Merged {
  const queue = joinQueues(newer.removalQueue, older.removalQueue);
  const placement = choose(newer, older, queue);
  if (placement?.kind === "scheduled") raise(queue, entryOf(placement, "keep"));
  return { placement, queue: sortedQueue(queue) };
}
