/**
 * UsageTab rendered table — one bold total row per month (reverse-chron sorted
 * by the caller) plus an indented per-purpose breakdown, all folded from the
 * synced `usageEvents` log. No legacy `—` handling: every row is a real fold, so
 * the input/output split is always present.
 */

import { useTranslate } from "../../../i18n/use-translate";
import type { MonthUsage } from "./usage-table-types";
import { UsageMonthRow } from "./UsageMonthRow";

export type { MonthUsage, UsagePurpose } from "./usage-table-types";
export { USAGE_PURPOSES } from "./usage-table-types";

export type UsageTableProps = {
  rows: MonthUsage[];
  monthsWindow: number;
};

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
            <th className="py-2 pr-4 font-medium">{t("usage.cost")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <UsageMonthRow key={row.yearMonth} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
