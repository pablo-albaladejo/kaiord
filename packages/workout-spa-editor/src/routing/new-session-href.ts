import { isValidCalendarDate } from "../utils/is-valid-calendar-date";
import { parseBackOrigin } from "./back-origin";
import { calendarWeekHref } from "./calendar-week-href";
import { resolveBackTarget } from "./resolve-back-target";

/** The "New session" sheet and the three ways it starts a session. */
export type NewSessionMode = "sheet" | "blank" | "import" | "template";

/** Where the session was asked for: the day, the week and the surface. */
export type NewSessionContext = {
  date?: string | null;
  week?: string | null;
  from?: string | null;
  sport?: string | null;
};

const MARKERS: Record<NewSessionMode, [string, string] | null> = {
  sheet: null,
  blank: ["source", "scratch"],
  import: ["action", "import"],
  template: ["source", "template-picker"],
};

/**
 * Every exit of the sheet restates the context it was opened with, so the
 * day a session lands on never depends on which button the user pressed.
 * Only the blank editor reads the sport; an import takes it from the file.
 */
export function buildNewSessionHref(
  mode: NewSessionMode,
  { date, week, from, sport }: NewSessionContext = {}
): string {
  const params = new URLSearchParams();
  const marker = MARKERS[mode];
  if (marker) params.set(marker[0], marker[1]);
  if (date) params.set("date", date);
  if (week) params.set("week", week);
  if (from) params.set("from", from);
  if (mode === "blank" && sport) params.set("sport", sport);
  const path = mode === "template" ? "/library" : "/workout/new";
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Closing the sheet leaves the creation flow. A calendar origin returns to
 * the week holding the day (never to the sheet, which is the current URL);
 * any other origin uses its own back target.
 */
export function sheetCloseHref({
  date,
  week,
  from,
}: NewSessionContext): string {
  const origin = parseBackOrigin(from ?? null);
  const calendarOrigin = origin === "calendar" || origin === "calendar-day";
  if (origin && !calendarOrigin) {
    return resolveBackTarget({ origin, date, week });
  }
  if (date && isValidCalendarDate(date)) return calendarWeekHref(date);
  return week ? `/calendar/${week}` : "/calendar";
}
