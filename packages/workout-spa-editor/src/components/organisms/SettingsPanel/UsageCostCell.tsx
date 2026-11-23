import type { UsageTotals } from "../../../application/usage/fold-usage-events";
import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";
import { formatUsageCost } from "./format-usage-cost";

/** The cost, and how many runs it leaves out because their price is unknown. */
export function CostCell({
  totals,
  locale,
}: {
  totals: UsageTotals;
  locale: string;
}) {
  const t = useTranslate("settings");
  const unknown = totals.unknownCostRuns;
  return (
    <>
      {formatUsageCost(totals.totalCost, locale)}
      {unknown > 0 && (
        <span className="block text-ink-muted">
          {t(pluralKey("usage.unknownCost", unknown), { count: unknown })}
        </span>
      )}
    </>
  );
}
