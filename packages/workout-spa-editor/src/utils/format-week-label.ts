/**
 * Human-readable week label in the active locale: "Apr 27 – May 3 · W18",
 * "27 abr – 3 may · S18".
 *
 * Cross-year weeks include both years to disambiguate. Falls back to the
 * raw weekId when the input is malformed (the calendar's invalid-week
 * handling redirects before reaching this function in production).
 */

import { DEFAULT_LOCALE, type Locale } from "@kaiord/i18n";

import { getTranslate } from "../i18n/use-translate";
import { parseWeekId } from "./week-utils";

const format = (date: string, locale: Locale, withYear: boolean): string =>
  new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));

export function formatWeekLabel(
  weekId: string,
  locale: Locale = DEFAULT_LOCALE
): string {
  const range = parseWeekId(weekId);
  if (!range) return weekId;
  const crossesYear = range.start.slice(0, 4) !== range.end.slice(0, 4);
  const start = format(range.start, locale, crossesYear);
  const end = format(range.end, locale, crossesYear);
  const n = weekId.split("-W")[1] ?? "";
  const week = getTranslate("calendar", locale)("weekNav.weekNumber", { n });
  return `${start} – ${end} · ${week}`;
}
