/**
 * Settings → Usage tab. Displays accumulated AI token usage and estimated cost
 * for the current month plus the previous five, read from the synced
 * `usageEvents` log via `useUsageSummary` and folded per month by
 * `foldUsageEvents` — a per-month total plus a per-purpose breakdown. Updates
 * automatically as new runs append events.
 */

import { foldUsageEvents } from "../../../application/usage/fold-usage-events";
import { useUsageSummary } from "../../../hooks/use-usage-summary";
import type { UsageEventRecord } from "../../../types/usage-event-schemas";
import type { MonthUsage } from "./usage-table-types";
import { USAGE_PURPOSES } from "./usage-table-types";
import { UsageEmptyState } from "./UsageEmptyState";
import { UsageTable } from "./UsageTable";

const MONTHS_WINDOW = 6;

function foldByMonth(
  events: UsageEventRecord[],
  months: string[]
): MonthUsage[] {
  const byMonth = new Map<string, UsageEventRecord[]>();
  for (const e of events) {
    byMonth.set(e.yearMonth, [...(byMonth.get(e.yearMonth) ?? []), e]);
  }
  return months
    .map((yearMonth) => {
      const rows = byMonth.get(yearMonth) ?? [];
      const byPurpose = Object.fromEntries(
        USAGE_PURPOSES.map((p) => [p, foldUsageEvents(rows, { purpose: p })])
      ) as MonthUsage["byPurpose"];
      return { yearMonth, totals: foldUsageEvents(rows), byPurpose };
    })
    .filter((m) => m.totals.totalTokens > 0);
}

export const UsageTab: React.FC = () => {
  const { months, events } = useUsageSummary(MONTHS_WINDOW);

  if (!events) return <UsageEmptyState monthsWindow={MONTHS_WINDOW} />;
  const rows = foldByMonth(events, months);
  if (rows.length === 0)
    return <UsageEmptyState monthsWindow={MONTHS_WINDOW} />;
  return <UsageTable rows={rows} monthsWindow={MONTHS_WINDOW} />;
};
