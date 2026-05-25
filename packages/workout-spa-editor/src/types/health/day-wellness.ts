/**
 * `DayWellness` — the calendar-band view-model for a single day.
 *
 * A present-metric subset of the persisted health records: each field
 * is the already-formatted display value for one inline badge. A present
 * `DayWellness` always carries ≥1 metric (the per-week hook omits days
 * and metrics with no data rather than emitting present-but-empty), so
 * the band can render every populated field unconditionally.
 */
export type WellnessMetric = "sleep" | "hrv" | "weight" | "steps";

export type DayWellness = {
  /** Sleep score (0-100) when present, else duration in hours. */
  sleep?: string;
  /** HRV rMSSD in milliseconds. */
  hrv?: string;
  /** Body weight in kilograms. */
  weight?: string;
  /** Daily step count. */
  steps?: string;
};
