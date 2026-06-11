import { getWeekIdForDate } from "../utils/week-utils";

/**
 * Calendar landing target for a workout date: the week route that contains
 * `date`, so the card is visible on arrival. Local-midnight constructor —
 * `getWeekIdForDate` reads local calendar fields, so a UTC anchor would
 * shift the week in far-east timezones (UTC+13/+14) at week boundaries.
 */
export function calendarWeekHref(date: string): string {
  const parts = date.split("-").map(Number);
  const [year, month, day] = parts;
  return `/calendar/${getWeekIdForDate(new Date(year ?? 0, (month ?? 1) - 1, day ?? 1))}`;
}
