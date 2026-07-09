/**
 * Locale-aware short weekday / month names for the calendar week views.
 *
 * Derives names from `Intl.DateTimeFormat` at the active locale instead of
 * hardcoded English arrays, so day/month labels localize automatically. The
 * ISO date is anchored at noon UTC and formatted in UTC so the weekday and
 * month match the calendar's date-only semantics regardless of the viewer's
 * timezone.
 */

import { DEFAULT_LOCALE, type Locale } from "@kaiord/i18n";

const noonUtc = (date: string): Date => new Date(`${date}T12:00:00Z`);

export const shortWeekdayName = (
  date: string,
  locale: Locale = DEFAULT_LOCALE
): string =>
  new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  }).format(noonUtc(date));

export const shortMonthName = (
  date: string,
  locale: Locale = DEFAULT_LOCALE
): string =>
  new Intl.DateTimeFormat(locale, {
    month: "short",
    timeZone: "UTC",
  }).format(noonUtc(date));
