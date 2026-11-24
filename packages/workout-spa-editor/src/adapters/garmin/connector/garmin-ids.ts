/**
 * Garmin ids and calendar dates as the Connector sends them: canonical
 * decimals (positive, no leading zero) and real `YYYY-MM-DD` dates, so a
 * request is refused here, before anything is sent, rather than by the
 * extension's closed list.
 */
const GARMIN_ID = /^[1-9]\d*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const isGarminId = (v: unknown): v is string =>
  typeof v === "string" && GARMIN_ID.test(v);

// A real calendar date, not merely the shape (rejects 2026-02-30).
export const isIsoDate = (v: unknown): v is string => {
  if (typeof v !== "string" || !ISO_DATE.test(v)) return false;
  const ms = Date.parse(`${v}T00:00:00Z`);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === v;
};

// Garmin answers a numeric id; the App's branded ids are digit strings.
export const toScheduleId = (v: unknown): string | null => {
  if (typeof v === "number" && Number.isSafeInteger(v) && v > 0) {
    return String(v);
  }
  return isGarminId(v) ? v : null;
};
