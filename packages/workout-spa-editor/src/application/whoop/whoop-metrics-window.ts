/**
 * Window helpers for the WHOOP heart-rate-series sync. Unlike the cycles sync
 * (one bounded window, chunked to a 200-day cap), the `metrics-service`
 * heart_rate response is read PER CALENDAR DAY — the converter buckets one
 * day's samples into one series, and its `externalId` is keyed on
 * `(userId, date)`. `eachCalendarDay` walks the UTC calendar days spanned by
 * `[startTime, endTime]`; `buildMetricsPath` builds the read path for one day
 * from the numeric user id and the requested sample cadence.
 */
const METRICS_PATH = "/metrics-service/v1/metrics/user";
const MS_PER_DAY = 86_400_000;

export type CalendarDay = {
  date: string;
  dayStartISO: string;
  dayEndISO: string;
};

const dateOnlyMs = (iso: string): number =>
  Date.parse(`${iso.slice(0, 10)}T00:00:00.000Z`);

export const eachCalendarDay = (
  startTime: string,
  endTime: string
): CalendarDay[] => {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    return [];
  }
  const startDay = dateOnlyMs(startTime);
  const endDay = dateOnlyMs(endTime);
  const days: CalendarDay[] = [];
  for (let cursor = startDay; cursor <= endDay; cursor += MS_PER_DAY) {
    days.push({
      date: new Date(cursor).toISOString().slice(0, 10),
      dayStartISO: new Date(cursor).toISOString(),
      dayEndISO: new Date(cursor + MS_PER_DAY).toISOString(),
    });
  }
  return days;
};

export const buildMetricsPath = (
  userId: number,
  day: CalendarDay,
  stepSeconds: number
): string =>
  `${METRICS_PATH}/${userId}?name=heart_rate` +
  `&start=${encodeURIComponent(day.dayStartISO)}` +
  `&end=${encodeURIComponent(day.dayEndISO)}` +
  `&step=${stepSeconds}`;
