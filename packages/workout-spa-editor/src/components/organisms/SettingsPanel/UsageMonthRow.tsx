/**
 * One month of usage in the Usage table: a bold total row followed by an
 * indented sub-row per purpose that recorded tokens (chat / workout_generation
 * / lab_extraction). Purposes with no usage in the month are omitted.
 */

import type { UsageTotals } from "../../../application/usage/fold-usage-events";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { formatUsageCost } from "./format-usage-cost";
import type { MonthUsage, UsagePurpose } from "./usage-table-types";
import { USAGE_PURPOSES } from "./usage-table-types";

const PURPOSE_LABEL_KEY: Record<UsagePurpose, string> = {
  chat: "usage.purpose.chat",
  workout_generation: "usage.purpose.workout_generation",
  lab_extraction: "usage.purpose.lab_extraction",
};

const CELL = "py-2 pr-2 text-ink-strong sm:pr-4";
const SUB_CELL = "py-1 pr-2 text-ink-muted sm:pr-4";
// Matches the table head: the input/output split is hidden below `sm`.
const WIDE = "hidden sm:table-cell";

const numericCells = (totals: UsageTotals, cls: string, locale: string) => (
  <>
    <td className={`${cls} ${WIDE}`}>
      {totals.inputTokens.toLocaleString(locale)}
    </td>
    <td className={`${cls} ${WIDE}`}>
      {totals.outputTokens.toLocaleString(locale)}
    </td>
    <td className={cls}>{totals.totalTokens.toLocaleString(locale)}</td>
    <td className={cls}>{formatUsageCost(totals.totalCost, locale)}</td>
  </>
);

export function UsageMonthRow({ row }: { row: MonthUsage }) {
  const t = useTranslate("settings");
  const locale = useActiveLocale();
  const active = USAGE_PURPOSES.filter((p) => row.byPurpose[p].totalTokens > 0);
  return (
    <>
      <tr
        data-testid={`usage-row-${row.yearMonth}`}
        className="border-b border-edge-soft font-medium"
      >
        <td className={CELL}>{row.yearMonth}</td>
        <td
          className={`${CELL} ${WIDE}`}
          data-testid={`usage-input-${row.yearMonth}`}
        >
          {row.totals.inputTokens.toLocaleString(locale)}
        </td>
        <td
          className={`${CELL} ${WIDE}`}
          data-testid={`usage-output-${row.yearMonth}`}
        >
          {row.totals.outputTokens.toLocaleString(locale)}
        </td>
        <td className={CELL}>
          {row.totals.totalTokens.toLocaleString(locale)}
        </td>
        <td className={CELL}>
          {formatUsageCost(row.totals.totalCost, locale)}
        </td>
      </tr>
      {active.map((p) => (
        <tr
          key={p}
          data-testid={`usage-purpose-${row.yearMonth}-${p}`}
          className="border-b border-edge-soft last:border-0"
        >
          <td className={`${SUB_CELL} pl-3 sm:pl-6`}>
            {t(PURPOSE_LABEL_KEY[p])}
          </td>
          {numericCells(row.byPurpose[p], SUB_CELL, locale)}
        </tr>
      ))}
    </>
  );
}
