/**
 * UsageTab rendered table — one row per UsageRecord, reverse-chron
 * sorted by the caller.
 */

import type { UsageRecord } from "../../../types/usage-schemas";

export type UsageTableProps = {
  rows: UsageRecord[];
  monthsWindow: number;
};

export function UsageTable({ rows, monthsWindow }: UsageTableProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        AI Usage — last {monthsWindow} months
      </h3>
      <table className="w-full text-sm" data-testid="usage-table">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <th className="py-2 pr-4 font-medium">Month</th>
            <th className="py-2 pr-4 font-medium">Tokens</th>
            <th className="py-2 font-medium">Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.yearMonth}
              data-testid={`usage-row-${r.yearMonth}`}
              className="border-b border-gray-100 last:border-0 dark:border-gray-800"
            >
              <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">
                {r.yearMonth}
              </td>
              <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">
                {r.totalTokens.toLocaleString()}
              </td>
              <td className="py-2 text-gray-900 dark:text-gray-100">
                ${r.totalCost.toFixed(4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Values reflect actual usage recorded per batch run — not the pre-run
        estimate shown in the confirmation dialog.
      </p>
    </div>
  );
}
