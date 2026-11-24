/**
 * Settings → Usage tab. Displays accumulated AI token usage and cost for the
 * current month plus the previous five, read from the synced `usageEvents` log
 * via `useUsageSummary`: a per-month total with a per-purpose breakdown, the
 * cost by model with the prices it was computed from, and what the cost does
 * and does not count. Updates automatically as new runs append events.
 */

import {
  foldUsageByModel,
  foldUsageEvents,
} from "../../../application/usage/fold-usage-events";
import { useUsageSummary } from "../../../hooks/use-usage-summary";
import type { UsageEventRecord } from "../../../types/usage-event-schemas";
import type { MonthUsage } from "./usage-table-types";
import { USAGE_PURPOSES } from "./usage-table-types";
import { UsageByModel } from "./UsageByModel";
import { UsageCostNotes } from "./UsageCostNotes";
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
  const inWindow = events.filter((e) => months.includes(e.yearMonth));
  return (
    <div className="space-y-6">
      <UsageTable rows={rows} monthsWindow={MONTHS_WINDOW} />
      <UsageByModel
        models={foldUsageByModel(inWindow)}
        monthsWindow={MONTHS_WINDOW}
      />
      <UsageCostNotes totals={foldUsageEvents(inWindow)} />
    </div>
  );
};
