/**
 * One month of usage in the Usage table: a bold total row followed by an
 * indented sub-row per purpose that recorded tokens (chat / workout_generation
 * / lab_extraction). Purposes with no usage in the month are omitted.
 */

import type { UsageTotals } from "../../../application/usage/fold-usage-events";
import { useTranslate } from "../../../i18n/use-translate";
import type { MonthUsage, UsagePurpose } from "./usage-table-types";
import { USAGE_PURPOSES } from "./usage-table-types";

const PURPOSE_LABEL_KEY: Record<UsagePurpose, string> = {
  chat: "usage.purpose.chat",
  workout_generation: "usage.purpose.workout_generation",
  lab_extraction: "usage.purpose.lab_extraction",
};

const CELL = "py-2 pr-4 text-gray-900 dark:text-gray-100";
const SUB_CELL = "py-1 pr-4 text-gray-500 dark:text-gray-400";

const numericCells = (totals: UsageTotals, cls: string) => (
  <>
    <td className={cls}>{totals.inputTokens.toLocaleString()}</td>
    <td className={cls}>{totals.outputTokens.toLocaleString()}</td>
    <td className={cls}>{totals.totalTokens.toLocaleString()}</td>
    <td className={cls}>${totals.totalCost.toFixed(4)}</td>
  </>
);

export function UsageMonthRow({ row }: { row: MonthUsage }) {
  const t = useTranslate("settings");
  const active = USAGE_PURPOSES.filter((p) => row.byPurpose[p].totalTokens > 0);
  return (
    <>
      <tr
        data-testid={`usage-row-${row.yearMonth}`}
        className="border-b border-gray-100 font-medium dark:border-gray-800"
      >
        <td className={CELL}>{row.yearMonth}</td>
        <td className={CELL} data-testid={`usage-input-${row.yearMonth}`}>
          {row.totals.inputTokens.toLocaleString()}
        </td>
        <td className={CELL} data-testid={`usage-output-${row.yearMonth}`}>
          {row.totals.outputTokens.toLocaleString()}
        </td>
        <td className={CELL}>{row.totals.totalTokens.toLocaleString()}</td>
        <td className={CELL}>${row.totals.totalCost.toFixed(4)}</td>
      </tr>
      {active.map((p) => (
        <tr
          key={p}
          data-testid={`usage-purpose-${row.yearMonth}-${p}`}
          className="border-b border-gray-50 last:border-0 dark:border-gray-900"
        >
          <td className={`${SUB_CELL} pl-6`}>{t(PURPOSE_LABEL_KEY[p])}</td>
          {numericCells(row.byPurpose[p], SUB_CELL)}
        </tr>
      ))}
    </>
  );
}
