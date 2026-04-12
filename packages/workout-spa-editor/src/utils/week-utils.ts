/**
 * Week Utilities
 *
 * ISO 8601 week parsing, formatting, and date range calculations.
 * Weeks start on Monday (ISO standard).
 */

const WEEK_ID_REGEX = /^(\d{4})-W(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export type WeekRange = {
  weekId: string;
  start: string;
  end: string;
};

export function parseWeekId(weekId: string): WeekRange | null {
  const match = WEEK_ID_REGEX.exec(weekId);
  if (!match) return null;

  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;

  const monday = getIsoWeekMonday(year, week);
  if (!monday) return null;

  const sunday = new Date(monday.getTime() + 6 * MS_PER_DAY);
  return {
    weekId,
    start: toDateString(monday),
    end: toDateString(sunday),
  };
}

export function getCurrentWeekId(): string {
  return getWeekIdForDate(new Date());
}

export function getWeekIdForDate(date: Date): string {
  const { year, week } = getIsoWeekNumber(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function getAdjacentWeekId(weekId: string, delta: number): string {
  const range = parseWeekId(weekId);
  if (!range) return getCurrentWeekId();

  const base = new Date(range.start + "T12:00:00Z");
  base.setUTCDate(base.getUTCDate() + delta * 7);
  return getWeekIdForDate(base);
}

export function getWeekDays(weekId: string): string[] {
  const range = parseWeekId(weekId);
  if (!range) return [];

  const start = new Date(range.start + "T12:00:00Z");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getTime() + i * MS_PER_DAY);
    return toDateString(d);
  });
}

function getIsoWeekMonday(year: number, week: number): Date | null {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4.getTime());
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);

  const { year: checkYear, week: checkWeek } = getIsoWeekNumber(monday);
  if (checkYear !== year || checkWeek !== week) return null;

  return monday;
}

function getIsoWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7
  );
  return { year: d.getUTCFullYear(), week };
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}
