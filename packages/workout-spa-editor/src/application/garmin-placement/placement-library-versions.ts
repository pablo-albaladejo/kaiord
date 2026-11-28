/**
 * Which earlier library workouts of a record may be deleted, read from the
 * record alone: a version Kaiord created (`libraryVersions`, superseded,
 * never an id the record did not get from its own push), and only while
 * the row holds a settled `Placed`. A version the record still uses is
 * kept: the current library workout, the placement's or its `previous`'s,
 * and any calendar entry of the queue that is not `gone` (a replaced entry
 * whose delete has not succeeded, or an entry the athlete placed that
 * Kaiord recognized). The dates where the record knows the version stood
 * are the months the live read checks.
 */
import type { GarminWorkoutId } from "../../types/garmin-ledger";
import { isGarminPlaced } from "../../types/garmin-ledger";
import type { Row } from "./placement-row";

const usedIds = (row: Row): Set<string> => {
  const p = row.placement;
  const ids = new Set<string>();
  if (row.library && "workoutId" in row.library) ids.add(row.library.workoutId);
  if (p) ids.add(p.workoutId);
  if (p && "previous" in p && p.previous) ids.add(p.previous.workoutId);
  for (const e of row.removalQueue ?? [])
    if (e.state !== "gone") ids.add(e.workoutId);
  return ids;
};

export const deletableVersions = (row: Row | undefined): GarminWorkoutId[] => {
  if (!row || !isGarminPlaced(row.placement)) return [];
  const used = usedIds(row);
  return (row.libraryVersions ?? [])
    .filter((v) => v.created && v.state === "superseded")
    .filter((v) => !used.has(v.workoutId))
    .map((v) => v.workoutId);
};

/** One date per month the version is known to have stood in, plus the
    current placement's month. */
export const monthsToRead = (row: Row, workoutId: string): string[] => {
  const dates = [
    ...(row.placement ? [row.placement.date] : []),
    ...(row.removalQueue ?? [])
      .filter((e) => e.workoutId === workoutId)
      .map((e) => e.date),
  ];
  const byMonth = new Map(dates.map((d) => [d.slice(0, 7), d]));
  return [...byMonth.values()].sort();
};
