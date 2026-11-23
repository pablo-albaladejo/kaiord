import type { UsageTotals } from "../../../application/usage/fold-usage-events";
import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";
import { formatUsageCost } from "./format-usage-cost";

/**
 * The cost, whether it includes an estimate, and how many runs it leaves out
 * because their price is unknown. When no run has a known price there is no
 * cost to show, so "—", never $0.
 */
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
      {unknown > 0 && unknown === totals.runs
        ? "—"
        : formatUsageCost(totals.totalCost, locale)}
      {totals.estimatedRequests > 0 && (
        <span className="block text-ink-muted">
          {t("usage.includesEstimate")}
        </span>
      )}
      {unknown > 0 && (
        <span className="block text-ink-muted">
          {t(pluralKey("usage.unknownCost", unknown), { count: unknown })}
        </span>
      )}
    </>
  );
}
