/**
 * Default date windows used by the MVP health pages.
 *
 * Real date pickers come later; for now each page surfaces a
 * pragmatic "recent" window so the live hooks fire against a
 * meaningful range without the user having to pick one.
 *
 * Days are LOCAL calendar days, like the calendar and Daily: a record
 * entered for "today" after local midnight must fall inside the window.
 */
import { localIsoDate } from "../../../application/shared/date-utils";

const DAYS_IN_WEEK = 7;
const DAYS_IN_QUARTER = 90;

const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export const todayIso = (): string => localIsoDate(new Date());

export const lastNDays = (days: number) => ({
  start: localIsoDate(daysAgo(days - 1)),
  end: todayIso(),
});

export const lastSevenDays = () => lastNDays(DAYS_IN_WEEK);

export const lastNinetyDays = () => lastNDays(DAYS_IN_QUARTER);
