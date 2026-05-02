/**
 * formatRelativeTime — humanized relative-time helper for the
 * CoachingSyncButton tooltip.
 *
 * `now` is injected (not resolved via `Date.now()` inline) so tests are
 * deterministic without touching `vi.useFakeTimers`. Branches are
 * evaluated top-down; the first matching branch wins. All return values
 * are static literal strings (no user input is ever interpolated) so the
 * project's R-PIIInterpolation guard remains green.
 *
 * Branch table:
 *
 *   undefined                           → "never synced"
 *   diff <  60_000                       → "just now"
 *   diff <  3_600_000   (and ≥ 1m)       → "<n>m ago"
 *   diff < 86_400_000   (and ≥ 1h)       → "<n>h ago"
 *   different calendar day, < 48h        → "yesterday"
 *   diff < 604_800_000  (and ≥ 2d)       → "<n>d ago"
 *   anything older                       → ISO YYYY-MM-DD
 *
 * Per design D17 of calendar-coaching-redesign-completion.
 */

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const TWO_DAYS_MS = 2 * ONE_DAY_MS;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

const isoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const sameCalendarDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatRelativeTime = (
  date: Date | undefined,
  now: Date
): string => {
  if (date === undefined) return "never synced";

  const diff = now.getTime() - date.getTime();
  if (diff < ONE_MINUTE_MS) return "just now";
  if (diff < ONE_HOUR_MS) return `${Math.floor(diff / ONE_MINUTE_MS)}m ago`;
  if (diff < ONE_DAY_MS) return `${Math.floor(diff / ONE_HOUR_MS)}h ago`;
  if (!sameCalendarDay(date, now) && diff < TWO_DAYS_MS) return "yesterday";
  if (diff < ONE_WEEK_MS) return `${Math.floor(diff / ONE_DAY_MS)}d ago`;
  return isoDate(date);
};
