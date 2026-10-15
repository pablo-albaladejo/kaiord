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

const HEAD = "py-2 pr-2 font-medium sm:pr-4";
// A phone has room for the month, the total and the cost; the input/output
// split shows from the `sm` breakpoint up.
const WIDE_HEAD = `${HEAD} hidden sm:table-cell`;

export function UsageTable({ rows, monthsWindow }: UsageTableProps) {
  const t = useTranslate("settings");
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-ink-strong">
        {t("usage.heading", { count: monthsWindow })}
      </h3>
      <table className="w-full text-xs sm:text-sm" data-testid="usage-table">
        <thead>
          <tr className="border-b border-edge text-left text-ink-muted">
            <th className={HEAD}>{t("usage.month")}</th>
            <th className={WIDE_HEAD}>{t("usage.input")}</th>
            <th className={WIDE_HEAD}>{t("usage.output")}</th>
            <th className={HEAD}>{t("usage.total")}</th>
            <th className={HEAD}>{t("usage.cost")}</th>
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
