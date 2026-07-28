/**
 * useUsageSummary — the single read of the `usageEvents` log shared by the
 * Settings → Usage tab and the Settings index row. Returns the month keys it
 * queried (most recent first) alongside the raw events, so callers fold them
 * however they need: per-month tables, or a single current-month total.
 *
 * `events` is `undefined` while the live query resolves; callers SHALL treat
 * that as loading and not as "no usage".
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../adapters/dexie/dexie-database";
import { createDexieUsageEventRepository } from "../adapters/dexie/dexie-usage-event-repository";
import type { UsageEventRecord } from "../types/usage-event-schemas";

export type UsageSummary = {
  months: string[];
  events: UsageEventRecord[] | undefined;
};

const MONTH_DIGITS = 2;

/** Year-month keys (`YYYY-MM`, UTC) for the `count` most recent months. */
export const recentYearMonths = (
  count: number,
  now: Date = new Date()
): string[] =>
  Array.from({ length: count }, (_unused, index) => {
    const month = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1)
    );
    return `${month.getUTCFullYear()}-${String(
      month.getUTCMonth() + 1
    ).padStart(MONTH_DIGITS, "0")}`;
  });

export const useUsageSummary = (monthsWindow: number): UsageSummary => {
  // Recomputed every render rather than memoized on `monthsWindow`: a session
  // left open across midnight of the 1st must roll its window forward instead
  // of querying and labelling the month that just ended. The live query is
  // keyed on the joined string, so an unstable array identity costs nothing.
  const months = recentYearMonths(monthsWindow);
  const events = useLiveQuery(
    () => createDexieUsageEventRepository(db).listByMonths(months),
    [months.join(",")]
  );

  return { months, events };
};
