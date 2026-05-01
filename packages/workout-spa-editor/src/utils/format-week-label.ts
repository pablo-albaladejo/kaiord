/**
 * Human-readable week label: "Apr 27 – May 3 · W18".
 *
 * Same-month weeks abbreviate the second month; cross-year weeks include
 * both years to disambiguate. Falls back to the raw weekId when the
 * input is malformed (the calendar's invalid-week handling redirects
 * before reaching this function in production).
 */

import { parseWeekId } from "./week-utils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const fmt = (yyyymmdd: string): { y: number; m: string; d: number } => {
  const [y, m, d] = yyyymmdd.split("-").map(Number) as [number, number, number];
  return { y, m: MONTHS[m - 1] ?? "", d };
};

export function formatWeekLabel(weekId: string): string {
  const range = parseWeekId(weekId);
  if (!range) return weekId;
  const start = fmt(range.start);
  const end = fmt(range.end);
  const weekNum = weekId.split("-W")[1] ?? "";

  if (start.y !== end.y) {
    return `${start.m} ${start.d}, ${start.y} – ${end.m} ${end.d}, ${end.y} · W${weekNum}`;
  }
  return `${start.m} ${start.d} – ${end.m} ${end.d} · W${weekNum}`;
}
