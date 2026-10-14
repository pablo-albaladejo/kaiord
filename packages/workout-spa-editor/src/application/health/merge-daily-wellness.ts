/**
 * One daily-wellness reading per day out of the rows the sources wrote for
 * it (an imported Garmin/WHOOP/Tanita row, a manual steps row…). Rows are
 * never rewritten to combine them, so each keeps its provenance.
 *
 * Per field, the first ranked row that provides it wins. A manual row
 * provides only `steps`: its calories and intensity are zero-fill, not
 * values the athlete entered, so imported calories survive a manual entry.
 * Ranking: the policy's `sourceOrder` first; then manual (the athlete's own
 * word, by default); then source id, then row id. Never row order, so the
 * reading is the same whatever order the rows were written in.
 */
import type { HealthDailyRecord } from "../../types/health/health-records";

const MANUAL_SOURCE_BRIDGE_ID = "manual";

const FIELDS = [
  "steps",
  "activeCalories",
  "restingCalories",
  "intensityMinutes",
  "floorsClimbed",
] as const;
type Field = (typeof FIELDS)[number];

const MANUAL_FIELDS: ReadonlySet<Field> = new Set<Field>(["steps"]);

const isManual = (row: HealthDailyRecord): boolean =>
  row.sourceBridgeId === MANUAL_SOURCE_BRIDGE_ID;

const provides = (row: HealthDailyRecord, field: Field): boolean =>
  row.krd[field] !== undefined && (!isManual(row) || MANUAL_FIELDS.has(field));

const rankIn = (sourceOrder: readonly string[], row: HealthDailyRecord) => {
  const listed = sourceOrder.indexOf(row.sourceBridgeId ?? "");
  if (listed >= 0) return listed;
  return sourceOrder.length + (isManual(row) ? 0 : 1);
};

const compareText = (a: string, b: string): number =>
  a === b ? 0 : a < b ? -1 : 1;

const byRank =
  (sourceOrder: readonly string[]) =>
  (a: HealthDailyRecord, b: HealthDailyRecord): number =>
    rankIn(sourceOrder, a) - rankIn(sourceOrder, b) ||
    compareText(a.sourceBridgeId ?? "", b.sourceBridgeId ?? "") ||
    compareText(a.id, b.id);

export const mergeDailyWellnessDay = (
  rows: readonly HealthDailyRecord[],
  sourceOrder: readonly string[] = []
): HealthDailyRecord | undefined => {
  const ranked = [...rows].sort(byRank(sourceOrder));
  const base = ranked.find((row) => !isManual(row)) ?? ranked[0];
  if (!base) return undefined;
  const krd = { ...base.krd };
  for (const field of FIELDS) {
    const from = ranked.find((row) => provides(row, field));
    if (from) Object.assign(krd, { [field]: from.krd[field] });
  }
  return { ...base, krd };
};

export const mergeDailyWellnessByDay = (
  rows: readonly HealthDailyRecord[],
  sourceOrder: readonly string[] = []
): HealthDailyRecord[] => {
  const byDay = new Map<string, HealthDailyRecord[]>();
  for (const row of rows)
    byDay.set(row.date, [...(byDay.get(row.date) ?? []), row]);
  return [...byDay.keys()]
    .sort()
    .flatMap(
      (day) => mergeDailyWellnessDay(byDay.get(day) ?? [], sourceOrder) ?? []
    );
};
