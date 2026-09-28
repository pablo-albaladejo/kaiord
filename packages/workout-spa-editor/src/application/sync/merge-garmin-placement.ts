/**
 * The placement half of `mergeGarminLedgerRows` (MUST-D): supersession beats
 * the clock. `newer` / `older` come from the ledger total order, so the
 * result never depends on argument order. Pure, no I/O.
 *
 * Invariants:
 * - An id in either removal queue (normal or `held`) never becomes the merged
 *   `Placed`, and neither does an `unconfirmed` Placed that may be one of
 *   them (same workout, same date).
 * - When every `Placed` present is tainted that way, the merge is `uncertain`
 *   and the tainted ids are kept as `held`, never deleted and never dropped,
 *   so re-merging with either input yields the same row (absorption).
 * - The merged queue never holds the merged `Placed` or a normal entry for
 *   the merged `previous` — nothing current is ever sent to `unschedule`.
 * - When a free `Placed` wins, held entries become normal queued ones: that
 *   `Placed` is a trusted calendar entry, so removing them leaves no gap.
 * - A superseded `unconfirmed` Placed has no id to queue and is dropped: the
 *   worst case is an untracked duplicate, never a gap.
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";
import {
  type GarminPlaced,
  type GarminPlacement,
  type GarminRemovalEntry,
  isGarminPlaced,
} from "../../types/garmin-ledger";
import {
  holdIds,
  type Queue,
  releaseHeld,
  scheduleIdOf,
  sortedQueue,
  taintedIds,
  toRemovalEntry,
  uncertainFromHeld,
  unionRemovalQueues,
} from "./merge-garmin-removal-queue";

type Ledger = ExportLedgerEntry;
type Merged = { placement?: GarminPlacement; queue: GarminRemovalEntry[] };

const placedOf = (row: Ledger) =>
  isGarminPlaced(row.placement) ? row.placement : undefined;

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

/** Picks the merged placement; mutates `queue` (supersede, hold). */
const choose = (newer: Ledger, older: Ledger, queue: Queue) => {
  const placed = [placedOf(newer), placedOf(older)];
  const [candN, candO] = placed.map((p) =>
    p && taintedIds(p, queue).length === 0 ? p : undefined
  );
  if (candN && candO && sameEntry(candN, candO)) {
    // One entry seen twice: keep the side that knows its schedule id.
    const olderKnowsMore =
      candO.kind === "scheduled" && candN.kind !== "scheduled";
    return olderKnowsMore ? candO : candN;
  }
  // Two different entries: the newer row's wins and the older one is queued.
  if (candN) {
    if (candO?.kind === "scheduled")
      queue.set(candO.workoutScheduleId, toRemovalEntry(candO));
    return candN;
  }
  if (candO) return candO;
  const tainted = placed.flatMap((p) => (p ? taintedIds(p, queue) : []));
  if (tainted.length === 0)
    return pickInFlight(newer.placement, older.placement);
  // Every Placed present may be a queued entry: none can be trusted to
  // still exist on Garmin, and none may be deleted. Hold them all.
  holdIds(queue, tainted);
  return uncertainFromHeld(queue);
};

export function mergeGarminPlacement(newer: Ledger, older: Ledger): Merged {
  const queue = unionRemovalQueues(newer, older);
  const placement = choose(newer, older, queue);
  const previous =
    placement?.kind === "attempting" || placement?.kind === "uncertain"
      ? placement.previous
      : undefined;
  for (const id of [scheduleIdOf(placement), scheduleIdOf(previous)]) {
    if (id && !queue.get(id)?.held) queue.delete(id);
  }
  // A free Placed won: it is on the calendar and is none of the queued
  // entries, so deleting a held one can no longer leave a gap.
  if (isGarminPlaced(placement)) releaseHeld(queue);
  return { placement, queue: sortedQueue(queue) };
}
