/**
 * Default date windows used by the MVP health pages.
 *
 * Real date pickers come later; for now each page surfaces a
 * pragmatic "recent" window so the live hooks fire against a
 * meaningful range without the user having to pick one.
 */
const ISO_DATE_LENGTH = 10;
const DAYS_IN_WEEK = 7;
const DAYS_IN_QUARTER = 90;

const isoDate = (date: Date): string =>
  date.toISOString().slice(0, ISO_DATE_LENGTH);

const today = (): Date => new Date();

const daysAgo = (n: number): Date => {
  const d = today();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

export const todayIso = (): string => isoDate(today());

export const lastSevenDays = () => ({
  start: isoDate(daysAgo(DAYS_IN_WEEK - 1)),
  end: todayIso(),
});

export const lastNinetyDays = () => ({
  start: isoDate(daysAgo(DAYS_IN_QUARTER - 1)),
  end: todayIso(),
});

export const lastNDays = (days: number) => ({
  start: isoDate(daysAgo(days - 1)),
  end: todayIso(),
});
