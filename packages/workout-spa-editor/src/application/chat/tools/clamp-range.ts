/**
 * Date-range clamping for chat read tools.
 *
 * Tools accept optional `dateFrom`/`dateTo` (YYYY-MM-DD). Missing bounds
 * default to a recent window ending today; an over-wide span is clamped to
 * a hard maximum. The clamped range is echoed back to the model as
 * `range_used` so its answer can disclose the window actually queried.
 */

const DAY_MS = 86_400_000;
export const DEFAULT_RANGE_DAYS = 90;
export const MAX_RANGE_DAYS = 366;

export type DateRange = { from: string; to: string };

const toDate = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);
const toIso = (date: Date): string => date.toISOString().slice(0, 10);
const addDays = (iso: string, days: number): string =>
  toIso(new Date(toDate(iso).getTime() + days * DAY_MS));
const spanDays = (from: string, to: string): number =>
  Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS);

export const clampRange = (
  input: { dateFrom?: string; dateTo?: string },
  today: string,
  defaultDays: number = DEFAULT_RANGE_DAYS,
  maxDays: number = MAX_RANGE_DAYS
): DateRange => {
  const to = input.dateTo ?? today;
  let from = input.dateFrom ?? addDays(to, -defaultDays);
  if (from > to) from = to;
  if (spanDays(from, to) > maxDays) from = addDays(to, -maxDays);
  return { from, to };
};
