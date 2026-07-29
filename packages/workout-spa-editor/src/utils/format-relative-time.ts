/**
 * formatRelativeTime — humanized relative-time helper for the
 * CoachingSyncButton tooltip and the Settings sync row.
 *
 * `now` is injected (not resolved via `Date.now()` inline) so tests are
 * deterministic without touching `vi.useFakeTimers`. Branches are
 * evaluated top-down; the first matching branch wins.
 *
 * Returns a translation key (+ params) instead of a formatted string —
 * callers resolve it through their own `Translate`, using the
 * `relativeTime.*` keys in the shared `common` i18n namespace, so the
 * wording renders in the active UI locale instead of hardcoded English.
 *
 * Branch table:
 *
 *   undefined                           → relativeTime.neverSynced
 *   diff <  60_000                       → relativeTime.justNow
 *   diff <  3_600_000   (and ≥ 1m)       → relativeTime.minutesAgo_(one|other)
 *   diff < 86_400_000   (and ≥ 1h)       → relativeTime.hoursAgo_(one|other)
 *   different calendar day, < 48h        → relativeTime.yesterday
 *   diff < 604_800_000  (and ≥ 2d)       → relativeTime.daysAgo_(one|other)
 *   anything older                       → relativeTime.since (locale-formatted date)
 *
 * Per design D17 of calendar-coaching-redesign-completion.
 */

import { DEFAULT_LOCALE, type Locale } from "@kaiord/i18n";

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const TWO_DAYS_MS = 2 * ONE_DAY_MS;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

export type RelativeTimeResult = {
  key: string;
  params?: Record<string, string | number>;
};

const sameCalendarDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const pluralKey = (base: string, count: number): string =>
  `relativeTime.${base}_${count === 1 ? "one" : "other"}`;

export const formatRelativeTime = (
  date: Date | undefined,
  now: Date,
  locale: Locale = DEFAULT_LOCALE
): RelativeTimeResult => {
  if (date === undefined) return { key: "relativeTime.neverSynced" };

  const diff = now.getTime() - date.getTime();
  if (diff < ONE_MINUTE_MS) return { key: "relativeTime.justNow" };
  if (diff < ONE_HOUR_MS) {
    const count = Math.floor(diff / ONE_MINUTE_MS);
    return { key: pluralKey("minutesAgo", count), params: { count } };
  }
  if (diff < ONE_DAY_MS) {
    const count = Math.floor(diff / ONE_HOUR_MS);
    return { key: pluralKey("hoursAgo", count), params: { count } };
  }
  if (!sameCalendarDay(date, now) && diff < TWO_DAYS_MS) {
    return { key: "relativeTime.yesterday" };
  }
  if (diff < ONE_WEEK_MS) {
    const count = Math.floor(diff / ONE_DAY_MS);
    return { key: pluralKey("daysAgo", count), params: { count } };
  }
  return {
    key: "relativeTime.since",
    params: {
      date: date.toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  };
};
