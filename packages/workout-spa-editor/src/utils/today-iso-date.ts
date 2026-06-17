const PAD = 2;

/**
 * Today's calendar date as `YYYY-MM-DD` in the user's LOCAL timezone.
 *
 * Built from local Date components (not `toISOString().slice(0, 10)`,
 * which yields the UTC day and is off by one near midnight in non-UTC
 * timezones — see #747). This matches the local-day convention used by
 * the calendar / coaching / Daily surfaces (`toIsoDate` / `isoToLocalDate`
 * in Today/today-dates.ts) so a workout scheduled "today" lands on the
 * day the user actually sees.
 */
export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(PAD, "0");
  const day = String(now.getDate()).padStart(PAD, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
