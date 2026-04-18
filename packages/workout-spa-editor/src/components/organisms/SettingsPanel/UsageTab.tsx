/**
 * Settings → Usage tab. Displays accumulated AI token usage and
 * estimated cost for the current month plus the previous five. Read-
 * only projection over the Dexie `usage` table (one row per
 * yearMonth) via `useLiveQuery` — updates automatically after each
 * batch run writes a new UsageRecord.
 */

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../../adapters/dexie/dexie-database";
import type { UsageRecord } from "../../../types/usage-schemas";
import { UsageEmptyState } from "./UsageEmptyState";
import { UsageTable } from "./UsageTable";

const MONTHS_WINDOW = 6;

function recentYearMonths(): string[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = 0; i < MONTHS_WINDOW; i++) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
    );
    months.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    );
  }
  return months;
}

export const UsageTab: React.FC = () => {
  const window = recentYearMonths();
  const rows = useLiveQuery(
    () =>
      db.table<UsageRecord>("usage").where("yearMonth").anyOf(window).toArray(),
    [window.join(",")]
  );

  if (!rows || rows.length === 0) {
    return <UsageEmptyState monthsWindow={MONTHS_WINDOW} />;
  }
  const sorted = [...rows].sort((a, b) =>
    b.yearMonth.localeCompare(a.yearMonth)
  );
  return <UsageTable rows={sorted} monthsWindow={MONTHS_WINDOW} />;
};
