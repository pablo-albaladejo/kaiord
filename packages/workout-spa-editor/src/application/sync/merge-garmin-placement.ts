/**
 * The placement half of `mergeGarminLedgerRows` (MUST-D): supersession beats
 * the clock. `newer` / `older` come from the ledger total order, so the
 * result never depends on argument order. Pure, no I/O.
 *
 * Invariant: an id in either removal queue never becomes the merged
 * `Placed`, and the merged queue never holds the merged `Placed` or the
 * merged `previous` — nothing current is ever sent to `unschedule`.
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";
import {
  type GarminPlaced,
  type GarminPlacement,
  type GarminRemovalEntry,
  isGarminPlaced,
} from "../../types/garmin-ledger";
import {
  scheduleIdOf,
  toRemovalEntry,
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

type Choice = {
  placement?: GarminPlacement;
  /** The losing candidate, queued for deletion. */
  supersede?: GarminPlaced;
  /** Queued placements that must leave the queue (never deleted). */
  keep: GarminPlacement[];
};

const choose = (
  newer: Ledger,
  older: Ledger,
  queued: Map<string, GarminRemovalEntry>
): Choice => {
  const [placedN, placedO] = [placedOf(newer), placedOf(older)];
  const free = (p?: GarminPlaced) => {
    const id = scheduleIdOf(p);
    return p && !(id && queued.has(id)) ? p : undefined;
  };
  const [candN, candO] = [free(placedN), free(placedO)];
  if (candN && candO && sameEntry(candN, candO)) {
    // One entry seen twice: keep the side that knows its schedule id.
    const olderKnowsMore =
      candO.kind === "scheduled" && candN.kind !== "scheduled";
    return { placement: olderKnowsMore ? candO : candN, keep: [] };
  }
  // Two different entries: the newer row's wins and the older one is queued.
  if (candN) return { placement: candN, supersede: candO, keep: [] };
  if (candO) return { placement: candO, keep: [] };
  const placed = placedN ?? placedO;
  if (!placed) {
    return {
      placement: pickInFlight(newer.placement, older.placement),
      keep: [],
    };
  }
  // Every Placed present is queued: none can be trusted to still exist on
  // Garmin, and none may be deleted. The next push resolves it.
  const { workoutId, date } = placed;
  const keep = [placedN, placedO].filter((p) => p !== undefined);
  return { placement: { kind: "uncertain", workoutId, date }, keep };
};

export function mergeGarminPlacement(newer: Ledger, older: Ledger): Merged {
  const queued = unionRemovalQueues(newer, older);
  const { placement, supersede, keep } = choose(newer, older, queued);
  if (supersede?.kind === "scheduled")
    queued.set(supersede.workoutScheduleId, toRemovalEntry(supersede));
  const previous =
    placement?.kind === "attempting" || placement?.kind === "uncertain"
      ? placement.previous
      : undefined;
  for (const p of [...keep, placement, previous]) {
    const id = scheduleIdOf(p);
    if (id) queued.delete(id);
  }
  return { placement, queue: [...queued.values()] };
}
