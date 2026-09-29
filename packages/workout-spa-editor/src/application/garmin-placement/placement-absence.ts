/**
 * Proof that a schedule id is gone from Garmin: a `calendar-find` of its
 * workout and date that carries ids (A3) and lacks it. A failed read, or a
 * read with an id-less entry, proves nothing.
 */
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import type { PlacementRun } from "./placement-deps";

export const absentFromCalendar = async (
  run: PlacementRun,
  entry: GarminRemovalEntry
): Promise<boolean> => {
  if (!run.deps.canFind || !run.deps.scheduleIdsInFind) return false;
  const read = await run.deps.calendar.find(entry.workoutId, entry.date);
  if (!read.ok) return false;
  const ids = read.entries.map((e) => e.workoutScheduleId);
  return ids.every(Boolean) && !ids.includes(entry.workoutScheduleId);
};
