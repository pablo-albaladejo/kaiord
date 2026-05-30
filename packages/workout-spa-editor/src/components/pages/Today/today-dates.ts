/**
 * Date helpers for the Today landing page.
 *
 * `toIsoDate` yields a local `YYYY-MM-DD` (matching how `WorkoutRecord.date`
 * is stored). `weekDays` returns the seven Monday-to-Sunday local dates of
 * the calendar week containing `today`.
 */

const DAYS_PER_WEEK = 7;
const MONDAY_OFFSET = 1;
const PAD = 2;

export type WeekDay = {
  iso: string;
  letter: string;
  dayNumber: number;
  isToday: boolean;
};

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + MONDAY_OFFSET).padStart(PAD, "0");
  const day = String(date.getDate()).padStart(PAD, "0");
  return `${year}-${month}-${day}`;
}

function mondayOf(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = result.getDay();
  const diff = (weekday + DAYS_PER_WEEK - MONDAY_OFFSET) % DAYS_PER_WEEK;
  result.setDate(result.getDate() - diff);
  return result;
}

export function weekDays(today: Date): WeekDay[] {
  const monday = mondayOf(today);
  const todayIso = toIsoDate(today);
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const iso = toIsoDate(date);
    return {
      iso,
      letter: WEEKDAY_LETTERS[index],
      dayNumber: date.getDate(),
      isToday: iso === todayIso,
    };
  });
}
