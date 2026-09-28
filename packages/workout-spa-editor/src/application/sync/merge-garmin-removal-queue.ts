/**
 * Removal-queue helpers for the Garmin ledger merge. Pure, no I/O.
 *
 * The union is monotone — `max(attempts)`, OR of `abandoned`, OR of `held` —
 * and `held` is released only as a function of the merged placement, so
 * re-merging a row with a merge it took part in never changes the queue
 * (absorption).
 */
import type { ExportLedgerEntry } from "../../types/export-ledger";
import type {
  GarminPlaced,
  GarminPlacement,
  GarminRemovalEntry,
} from "../../types/garmin-ledger";

export type Queue = Map<string, GarminRemovalEntry>;

export const scheduleIdOf = (p: GarminPlacement | undefined) =>
  p?.kind === "scheduled" ? p.workoutScheduleId : undefined;

const joinEntries = (
  x: GarminRemovalEntry,
  y: GarminRemovalEntry
): GarminRemovalEntry => {
  const joined: GarminRemovalEntry = {
    ...x,
    attempts: Math.max(x.attempts, y.attempts),
    abandoned: x.abandoned || y.abandoned,
  };
  delete joined.held;
  if (x.held || y.held) joined.held = true;
  return joined;
};

/** Union by id, `newer`'s entries first; a `held` entry dominates. */
export const unionRemovalQueues = (
  newer: ExportLedgerEntry,
  older: ExportLedgerEntry
): Queue => {
  const byId: Queue = new Map();
  const all = [...(newer.removalQueue ?? []), ...(older.removalQueue ?? [])];
  for (const entry of all) {
    const seen = byId.get(entry.workoutScheduleId);
    byId.set(entry.workoutScheduleId, seen ? joinEntries(seen, entry) : entry);
  }
  return byId;
};

/** The queued ids that may be the calendar entry `p` stands for: its own id
    when queued, or — for an `unconfirmed` Placed, which has no id — every
    queued entry of the same workout on the same date. Empty ⇒ `p` is free. */
export const taintedIds = (p: GarminPlaced, queue: Queue): string[] => {
  if (p.kind === "scheduled")
    return queue.has(p.workoutScheduleId) ? [p.workoutScheduleId] : [];
  return [...queue.values()]
    .filter((e) => e.workoutId === p.workoutId && e.date === p.date)
    .map((e) => e.workoutScheduleId);
};

export const holdIds = (queue: Queue, ids: string[]) => {
  for (const id of ids) {
    const entry = queue.get(id);
    if (entry) queue.set(id, { ...entry, held: true });
  }
};

export const releaseHeld = (queue: Queue) => {
  for (const [id, entry] of queue) {
    if (!entry.held) continue;
    const released = { ...entry };
    delete released.held;
    queue.set(id, released);
  }
};

/** A canonical order (numeric id order), so the merged queue never depends
    on which rows were merged first. */
export const sortedQueue = (queue: Queue): GarminRemovalEntry[] =>
  [...queue.values()].sort(
    (x, y) =>
      x.workoutScheduleId.length - y.workoutScheduleId.length ||
      (x.workoutScheduleId < y.workoutScheduleId ? -1 : 1)
  );

const entryKey = (e: GarminRemovalEntry) =>
  `${e.date}\u0000${e.workoutId}\u0000${e.workoutScheduleId}`;

/** The `uncertain` target, a function of the held entries alone (the latest
    date, then the larger workout id, then the larger schedule id), so it is
    the same whichever rows — or earlier merges of them — produced them. */
export const uncertainFromHeld = (queue: Queue): GarminPlacement => {
  // Only called once `holdIds` held at least one tainted id: never empty.
  const top = [...queue.values()]
    .filter((e) => e.held)
    .reduce((best, e) => (entryKey(e) > entryKey(best) ? e : best));
  return { kind: "uncertain", workoutId: top.workoutId, date: top.date };
};

/** A superseded scheduled entry, fresh in the queue. */
export const toRemovalEntry = (
  p: GarminPlaced & { kind: "scheduled" }
): GarminRemovalEntry => ({
  workoutScheduleId: p.workoutScheduleId,
  workoutId: p.workoutId,
  date: p.date,
  attempts: 0,
  abandoned: false,
});
