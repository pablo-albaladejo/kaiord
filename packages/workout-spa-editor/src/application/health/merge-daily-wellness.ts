/**
 * One daily-wellness reading per day out of the rows the sources wrote for
 * it (FIT imports, manual steps…). The reading is not a stored row: it is
 * the head row's record, with the head's id and provenance, and no row is
 * ever rewritten to produce it.
 *
 * Rows are ranked by the priority order (listed sources first), then
 * manual, then source id, then row id — never by storage order. The head
 * is the first full row and is read whole, as the resolver reads priority.
 * The one exception is a pure manual row (steps only): ranked above the
 * head, its steps replace the head's. A legacy manual row, an imported row
 * an older save re-stamped `manual`, holds measured values and is read as
 * a full row. Under priority, rows of a bridge whose import is disabled
 * are dropped; a source with no import policy (a FIT import) stays as a
 * fallback after the listed ones.
 */
import type { HealthDailyRecord } from "../../types/health/health-records";
import { MANUAL_SOURCE_BRIDGE_ID } from "../import/stamp-provenance";
import { isLegacyManualRow } from "./manual-steps-row";

export type PriorityReadPolicy = {
  order: readonly string[];
  disabled: ReadonlySet<string>;
};

const isManual = (row: HealthDailyRecord): boolean =>
  row.sourceBridgeId === MANUAL_SOURCE_BRIDGE_ID;

const isPureManual = (row: HealthDailyRecord): boolean =>
  isManual(row) && !isLegacyManualRow(row);

const rankIn = (order: readonly string[], row: HealthDailyRecord): number => {
  const listed = order.indexOf(row.sourceBridgeId ?? "");
  if (listed >= 0) return listed;
  return order.length + (isManual(row) ? 0 : 1);
};

const compareText = (a: string, b: string): number =>
  a === b ? 0 : a < b ? -1 : 1;

const byRank =
  (order: readonly string[]) =>
  (a: HealthDailyRecord, b: HealthDailyRecord): number =>
    rankIn(order, a) - rankIn(order, b) ||
    compareText(a.sourceBridgeId ?? "", b.sourceBridgeId ?? "") ||
    compareText(a.id, b.id);

const stepsOnly = (row: HealthDailyRecord): HealthDailyRecord => {
  const { kind, version, date, steps } = row.krd;
  return { ...row, krd: { kind, version, date, steps } };
};

export const mergeDailyWellnessDay = (
  rows: readonly HealthDailyRecord[],
  policy?: PriorityReadPolicy
): HealthDailyRecord | undefined => {
  const ranked = rows
    .filter((row) => !policy?.disabled.has(row.sourceBridgeId ?? ""))
    .sort(byRank(policy?.order ?? []));
  const headAt = ranked.findIndex((row) => !isPureManual(row));
  const manualAt = ranked.findIndex(isPureManual);
  const head = ranked[headAt];
  const manual = ranked[manualAt];
  if (!head) return manual && stepsOnly(manual);
  if (!manual || manualAt > headAt) return head;
  return { ...head, krd: { ...head.krd, steps: manual.krd.steps } };
};

export const mergeDailyWellnessByDay = (
  rows: readonly HealthDailyRecord[],
  policy?: PriorityReadPolicy
): HealthDailyRecord[] => {
  const byDay = new Map<string, HealthDailyRecord[]>();
  for (const row of rows) {
    const day = byDay.get(row.date);
    if (day) day.push(row);
    else byDay.set(row.date, [row]);
  }
  return [...byDay.keys()]
    .sort()
    .flatMap(
      (day) => mergeDailyWellnessDay(byDay.get(day) ?? [], policy) ?? []
    );
};
