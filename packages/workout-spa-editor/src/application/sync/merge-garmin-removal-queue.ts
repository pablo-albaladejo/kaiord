/**
 * Removal-queue helpers for the Garmin ledger merge. Pure, no I/O.
 *
 * The queue is a grow-only map from schedule id to a state on
 * `held < keep < retire < gone`. Joining takes the higher state, the larger
 * `attempts` and the OR of `abandoned`, and nothing is ever removed, so a
 * re-merge can neither resurrect an id nor drop a tombstone (absorption).
 */
import {
  type GarminPlaced,
  type GarminPlacement,
} from "../../types/garmin-ledger";
import {
  GARMIN_REMOVAL_STATES,
  type GarminRemovalEntry,
  type GarminRemovalState,
} from "../../types/garmin-removal-entry";

export type Queue = Map<string, GarminRemovalEntry>;

const rank = (e: GarminRemovalEntry) => GARMIN_REMOVAL_STATES.indexOf(e.state);

const entryKey = (e: GarminRemovalEntry) =>
  `${e.date}\u0000${e.workoutId}\u0000${e.workoutScheduleId}`;

const joinEntries = (
  x: GarminRemovalEntry,
  y: GarminRemovalEntry
): GarminRemovalEntry => {
  const order = rank(x) - rank(y) || (entryKey(x) >= entryKey(y) ? 1 : -1);
  return {
    ...(order > 0 ? x : y),
    attempts: Math.max(x.attempts, y.attempts),
    abandoned: x.abandoned || y.abandoned,
  };
};

/** Joins `entry` into `queue` by its id. */
export const raise = (queue: Queue, entry: GarminRemovalEntry) => {
  const seen = queue.get(entry.workoutScheduleId);
  queue.set(entry.workoutScheduleId, seen ? joinEntries(seen, entry) : entry);
};

export const joinQueues = (
  ...queues: (GarminRemovalEntry[] | undefined)[]
): Queue => {
  const joined: Queue = new Map();
  for (const entry of queues.flatMap((q) => q ?? [])) raise(joined, entry);
  return joined;
};

/** A `Placed` that may not be live: a `scheduled` whose id is not `keep`,
    or an `unconfirmed` (no id) whose workout and date match an entry that
    is not `keep` — `gone` included, else a drained id loses its taint —
    unless that entry is a `retire` / `gone` one its `supersedes` lists: an
    id known before the placement's entry existed is another entry. */
export const isTainted = (p: GarminPlaced, queue: Queue): boolean => {
  if (p.kind === "scheduled") {
    const state = queue.get(p.workoutScheduleId)?.state;
    return state !== undefined && state !== "keep";
  }
  const listed = new Set<string>(p.supersedes);
  const superseded = (e: GarminRemovalEntry) =>
    listed.has(e.workoutScheduleId) &&
    (e.state === "retire" || e.state === "gone");
  return [...queue.values()].some(
    (e) =>
      e.workoutId === p.workoutId &&
      e.date === p.date &&
      e.state !== "keep" &&
      !superseded(e)
  );
};

export const entryOf = (
  p: GarminPlaced & { kind: "scheduled" },
  state: GarminRemovalState
): GarminRemovalEntry => ({
  workoutScheduleId: p.workoutScheduleId,
  workoutId: p.workoutId,
  date: p.date,
  attempts: 0,
  abandoned: false,
  state,
});

/** A canonical order (numeric id order), so the merged queue never depends
    on which rows were merged first. */
export const sortedQueue = (queue: Queue): GarminRemovalEntry[] =>
  [...queue.values()].sort(
    (x, y) =>
      x.workoutScheduleId.length - y.workoutScheduleId.length ||
      (x.workoutScheduleId < y.workoutScheduleId ? -1 : 1)
  );

const maxEntry = (entries: GarminRemovalEntry[]) =>
  entries.reduce<GarminRemovalEntry | undefined>(
    (best, e) => (!best || entryKey(e) > entryKey(best) ? e : best),
    undefined
  );

/** The `uncertain` target: the maximum `held` entry (latest date, then the
    larger workout id, then the larger schedule id), else the maximum of all
    entries — a function of the merged queue alone, so every re-merge picks
    the same one. Undefined only for an empty queue. */
export const uncertainTarget = (queue: Queue): GarminPlacement | undefined => {
  const all = [...queue.values()];
  const top = maxEntry(all.filter((e) => e.state === "held")) ?? maxEntry(all);
  return top && { kind: "uncertain", workoutId: top.workoutId, date: top.date };
};
