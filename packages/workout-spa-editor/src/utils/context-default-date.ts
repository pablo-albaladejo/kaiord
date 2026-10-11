import { todayIsoDate } from "./today-iso-date";
import { getWeekDays } from "./week-utils";

/**
 * The date a schedule prompt proposes when the route names no day: today,
 * unless the user came from another calendar week, in which case that
 * week's first day — the proposal stays on the week they were looking at.
 */
export function contextDefaultDate(
  week: string | null,
  today: string = todayIsoDate()
): string {
  const days = week ? getWeekDays(week) : [];
  if (days.length === 0 || days.includes(today)) return today;
  return days[0] ?? today;
}
