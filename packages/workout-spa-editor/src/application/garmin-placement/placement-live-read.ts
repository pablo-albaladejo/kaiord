/**
 * The live read of a `Placed` that every placement decision shares: Garmin
 * is read by schedule id only (`calendar-find` with A3), and the id is
 * absent only when two reads `SETTLE_MS` apart both lack it (A5 promises a
 * new entry only after that). A failed read, an id-less entry on the date,
 * A3 false or an `unconfirmed` `Placed` (no id to see) proves nothing.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import { type LiveState, readLiveState } from "../safe-writes/live-state";
import type { CalendarEntry } from "./garmin-calendar-port";
import { provesAbsent } from "./placement-absence";
import type { PlacementDeps, PlacementRun } from "./placement-deps";
import { SETTLE_MS } from "./placement-timing";

export type Scheduled = GarminPlaced & { kind: "scheduled" };
export type PlacedRead = { state: LiveState; entries: CalendarEntry[] };

/** Garmin can be read by schedule id: `calendar-find` and A3. */
export const readsById = (deps: PlacementDeps) =>
  deps.canFind && deps.scheduleIdsInFind;

const readOnce = async (
  run: PlacementRun,
  placed: Scheduled
): Promise<PlacedRead> => {
  const read = await run.deps.calendar.find(placed.workoutId, placed.date);
  if (!read.ok) return { state: "unknown", entries: [] };
  const id = placed.workoutScheduleId;
  const { entries } = read;
  if (entries.some((e) => e.workoutScheduleId === id))
    return { state: "present", entries };
  const absent = provesAbsent(entries, id, placed.date);
  return { state: absent ? "absent" : "unknown", entries };
};

/** The `Placed`'s settled live state; `undefined` when Garmin cannot be
    read by id for it. */
export const readPlacedLive = (
  run: PlacementRun,
  placed: Scheduled
): Promise<PlacedRead> | undefined =>
  readsById(run.deps)
    ? readLiveState(() => readOnce(run, placed), {
        ms: SETTLE_MS,
        sleep: run.deps.sleep,
      })
    : undefined;
