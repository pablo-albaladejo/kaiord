import type { UsageTotals } from "../../../application/usage/fold-usage-events";
import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";

/**
 * What the Usage tab's cost counts (every billed attempt, at each model's own
 * prices) and the requests it cannot count because the Provider reported no
 * usage for them.
 */
export function UsageCostNotes({ totals }: { totals: UsageTotals }) {
  const t = useTranslate("settings");
  const unmeasured = totals.unmeasuredRequests;
  return (
    <div className="space-y-1 text-sm text-ink-muted">
      <p data-testid="usage-cost-basis" className="m-0">
        {t("usage.costBasis")}
      </p>
      {unmeasured > 0 && (
        <p data-testid="usage-unmeasured" className="m-0">
          {t(pluralKey("usage.unmeasured", unmeasured), { count: unmeasured })}
        </p>
      )}
    </div>
  );
}
