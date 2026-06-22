/**
 * Enumerates the inclusive ISO dates (YYYY-MM-DD) between `startDate` and
 * `endDate`, using the SPA's local, DST-safe date helpers so the boundaries
 * match how `WorkoutRecord.date` and the health records are stored.
 *
 * A `startDate` after `endDate` yields an empty list (no inverted ranges).
 */

import { addDaysIso } from "../../components/pages/Daily/today-dates";

const MAX_RANGE_DAYS = 366;

export const rangeDatesInclusive = (
  startDate: string,
  endDate: string
): string[] => {
  const dates: string[] = [];
  let cursor = startDate;
  for (let i = 0; i <= MAX_RANGE_DAYS && cursor <= endDate; i += 1) {
    dates.push(cursor);
    cursor = addDaysIso(cursor, 1);
  }
  return dates;
};
