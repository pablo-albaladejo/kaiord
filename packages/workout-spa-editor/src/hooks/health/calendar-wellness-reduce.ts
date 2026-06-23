/**
 * Reduces the four per-week health scans into the `wellnessByDay` map
 * consumed by the calendar band. Pure so it can be unit-tested without
 * Dexie and so `use-calendar-wellness-week-live` stays under its caps.
 *
 * Contract: a day key is emitted only when ≥1 metric is present, and a
 * metric field is set only when its source value exists. Days/metrics
 * with no data are omitted (never present-but-empty).
 */
import type { DayWellness } from "../../types/health/day-wellness";
import type {
  HealthDailyRecord,
  HealthHrvRecord,
  HealthSleepRecord,
  HealthWeightRecord,
} from "../../types/health/health-records";

const SECONDS_PER_HOUR = 3600;

export const formatSleep = (krd: HealthSleepRecord["krd"]): string =>
  typeof krd.score === "number"
    ? `${krd.score}`
    : `${(krd.totalDurationSeconds / SECONDS_PER_HOUR).toFixed(1)}h`;

const set = (
  map: Map<string, DayWellness>,
  date: string,
  patch: DayWellness
): void => {
  map.set(date, { ...map.get(date), ...patch });
};

export type WellnessScans = {
  sleep: HealthSleepRecord[];
  hrv: HealthHrvRecord[];
  weight: HealthWeightRecord[];
  daily: HealthDailyRecord[];
};

export const reduceWellnessByDay = (
  scans: WellnessScans
): Record<string, DayWellness> => {
  const map = new Map<string, DayWellness>();
  for (const r of scans.sleep) set(map, r.date, { sleep: formatSleep(r.krd) });
  for (const r of scans.hrv)
    set(map, r.date, { hrv: `${Math.round(r.krd.rMSSD)}` });
  for (const r of scans.weight)
    set(map, r.date, { weight: `${r.krd.weightKilograms.toFixed(1)}` });
  for (const r of scans.daily)
    if (typeof r.krd.steps === "number")
      set(map, r.date, { steps: `${r.krd.steps}` });
  return Object.fromEntries(map);
};

/**
 * Merges a per-day net-balance map (date → formatted net string, or null when
 * the day yields no badge) into an existing `wellnessByDay`, attaching the
 * `net` metric only where present. A net-only day still becomes a present
 * `DayWellness` entry so the band renders the badge alone.
 */
export const mergeNetByDay = (
  wellnessByDay: Record<string, DayWellness>,
  netByDay: Record<string, string | null>
): Record<string, DayWellness> => {
  const map = new Map<string, DayWellness>(Object.entries(wellnessByDay));
  for (const [date, net] of Object.entries(netByDay)) {
    if (net === null) continue;
    set(map, date, { net });
  }
  return Object.fromEntries(map);
};
