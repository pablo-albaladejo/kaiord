/**
 * Resolves the seven Monday-to-Sunday ISO dates (YYYY-MM-DD) of the calendar
 * week containing `iso`, using the SPA's local, DST-safe date helpers so the
 * week boundaries match how `WorkoutRecord.date` is stored.
 */

import { addDaysIso } from "../shared/date-utils";

const DAYS_PER_WEEK = 7;
const MONDAY_OFFSET = 1;

const mondayIsoOf = (iso: string): string => {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = new Date(year!, (month ?? 1) - 1, day ?? 1).getDay();
  const diff = (weekday + DAYS_PER_WEEK - MONDAY_OFFSET) % DAYS_PER_WEEK;
  return addDaysIso(iso, -diff);
};

export const weekDatesFrom = (iso: string): string[] => {
  const monday = mondayIsoOf(iso);
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) =>
    addDaysIso(monday, index)
  );
};
