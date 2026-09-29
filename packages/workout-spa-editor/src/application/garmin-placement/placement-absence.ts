/**
 * Proof that a schedule id is gone from Garmin: a `calendar-find` of its
 * workout and date that lacks it, with every entry on that date carrying
 * its id (A3). A failed read, or an id-less entry on that date, proves
 * nothing; an id-less entry elsewhere in the month cannot be it.
 */
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import type { CalendarEntry } from "./garmin-calendar-port";
import type { PlacementRun } from "./placement-deps";

/** The read lacks `id`, and every entry on `date` shows its id. */
export const provesAbsent = (
  entries: readonly CalendarEntry[],
  id: string,
  date: string
) =>
  entries.every((e) => e.date !== date || e.workoutScheduleId) &&
  !entries.some((e) => e.workoutScheduleId === id);

export const absentFromCalendar = async (
  run: PlacementRun,
  entry: GarminRemovalEntry
): Promise<boolean> => {
  if (!run.deps.canFind || !run.deps.scheduleIdsInFind) return false;
  const read = await run.deps.calendar.find(entry.workoutId, entry.date);
  if (!read.ok) return false;
  return provesAbsent(read.entries, entry.workoutScheduleId, entry.date);
};
