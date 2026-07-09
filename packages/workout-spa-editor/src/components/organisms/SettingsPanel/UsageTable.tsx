/**
 * UsageTab rendered table — one row per UsageRecord, reverse-chron
 * sorted by the caller. Tokens are shown split into input / output
 * columns; legacy rows (migrated from the pre-split schema) display
 * `—` under "Output" to avoid presenting a fabricated zero as fact.
 */

import { useTranslate } from "../../../i18n/use-translate";
import type { UsageRecord } from "../../../types/usage-schemas";

export type UsageTableProps = {
  rows: UsageRecord[];
  monthsWindow: number;
};

function formatOutput(row: UsageRecord): string {
  return row.legacy ? "—" : row.outputTokens.toLocaleString();
}

export function UsageTable({ rows, monthsWindow }: UsageTableProps) {
  const t = useTranslate("settings");
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {t("usage.heading", { count: monthsWindow })}
      </h3>
      <table className="w-full text-sm" data-testid="usage-table">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <th className="py-2 pr-4 font-medium">{t("usage.month")}</th>
            <th className="py-2 pr-4 font-medium">{t("usage.input")}</th>
            <th className="py-2 pr-4 font-medium">{t("usage.output")}</th>
            <th className="py-2 pr-4 font-medium">{t("usage.total")}</th>
            <th className="py-2 font-medium">{t("usage.cost")}</th>
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
              <td
                className="py-2 pr-4 text-gray-900 dark:text-gray-100"
                data-testid={`usage-input-${r.yearMonth}`}
              >
                {r.inputTokens.toLocaleString()}
              </td>
              <td
                className="py-2 pr-4 text-gray-900 dark:text-gray-100"
                data-testid={`usage-output-${r.yearMonth}`}
              >
                {formatOutput(r)}
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
        {t("usage.footnoteBefore")} <span aria-hidden="true">—</span>{" "}
        {t("usage.footnoteAfter")}
      </p>
    </div>
  );
}
