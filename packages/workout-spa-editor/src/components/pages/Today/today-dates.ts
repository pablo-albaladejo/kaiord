/**
 * Date helpers for the Daily page. NOTE: the `today-*` helpers encode the
 * literal calendar today (`realTodayIso`, `isRealToday`); the page concept is
 * "Daily". These names are intentionally retained for real-today semantics.
 *
 * `toIsoDate` yields a local `YYYY-MM-DD` (matching how `WorkoutRecord.date`
 * is stored). `weekDays` returns the seven Monday-to-Sunday local dates of the
 * calendar week containing the focused date, flagging each as the focus cursor
 * (`isFocused`) and/or the real calendar today (`isRealToday`).
 *
 * `isoToLocalDate` constructs a Date from a `YYYY-MM-DD` via the LOCAL
 * constructor (`new Date(y, m-1, d)`), never `new Date(iso)` (which parses as
 * UTC midnight and shifts the local day at timezone boundaries).
 */

const DAYS_PER_WEEK = 7;
const MONDAY_OFFSET = 1;
const PAD = 2;

export type WeekDay = {
  iso: string;
  letter: string;
  dayNumber: number;
  isFocused: boolean;
  isRealToday: boolean;
};

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + MONDAY_OFFSET).padStart(PAD, "0");
  const day = String(date.getDate()).padStart(PAD, "0");
  return `${year}-${month}-${day}`;
}

export function isoToLocalDate(iso: string): Date {
  const parts = iso.split("-").map(Number);
  const [year, month, day] = parts;
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

/** Adds `delta` days to a `YYYY-MM-DD` via the local constructor (DST-safe). */
export function addDaysIso(iso: string, delta: number): string {
  const date = isoToLocalDate(iso);
  date.setDate(date.getDate() + delta);
  return toIsoDate(date);
}

function mondayOf(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = result.getDay();
  const diff = (weekday + DAYS_PER_WEEK - MONDAY_OFFSET) % DAYS_PER_WEEK;
  result.setDate(result.getDate() - diff);
  return result;
}

export function weekDays(focus: Date, realTodayIso: string): WeekDay[] {
  const monday = mondayOf(focus);
  const focusIso = toIsoDate(focus);
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const iso = toIsoDate(date);
    return {
      iso,
      letter: WEEKDAY_LETTERS[index]!,
      dayNumber: date.getDate(),
      isFocused: iso === focusIso,
      isRealToday: iso === realTodayIso,
    };
  });
}
