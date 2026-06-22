/**
 * `DayWellness` — the calendar-band view-model for a single day.
 *
 * A present-metric subset of the persisted health records: each field
 * is the already-formatted display value for one inline badge. A present
 * `DayWellness` always carries ≥1 metric (the per-week hook omits days
 * and metrics with no data rather than emitting present-but-empty), so
 * the band can render every populated field unconditionally.
 */
export type WellnessMetric = "sleep" | "hrv" | "weight" | "steps" | "net";

export type DayWellness = {
  /** Sleep score (0-100) when present, else duration in hours. */
  sleep?: string;
  /** HRV rMSSD in milliseconds. */
  hrv?: string;
  /** Body weight in kilograms. */
  weight?: string;
  /** Daily step count. */
  steps?: string;
  /**
   * Net energy balance for the day, formatted as a signed deficit/surplus
   * string (e.g. "-600" / "+300"). Present ONLY when the day's expenditure is
   * resolvable; omitted otherwise so the band never shows a misleading zero.
   */
  net?: string;
};
