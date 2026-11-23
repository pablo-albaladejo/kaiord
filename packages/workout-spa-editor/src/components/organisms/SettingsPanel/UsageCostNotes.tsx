import type { UsageTotals } from "../../../application/usage/fold-usage-events";
import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";

/**
 * Whose usage the tab shows (this device's), what its cost counts (every
 * billed attempt, at each model's own prices), the requests it estimates
 * because they were cut before the Provider reported their usage, and the
 * ones it cannot count.
 */
export function UsageCostNotes({ totals }: { totals: UsageTotals }) {
  const t = useTranslate("settings");
  const unmeasured = totals.unmeasuredRequests;
  const estimated = totals.estimatedRequests;
  return (
    <div className="space-y-1 text-sm text-ink-muted">
      <p data-testid="usage-this-device" className="m-0">
        {t("usage.thisDevice")}
      </p>
      <p data-testid="usage-cost-basis" className="m-0">
        {t("usage.costBasis")}
      </p>
      {estimated > 0 && (
        <p data-testid="usage-estimated" className="m-0">
          {t(pluralKey("usage.estimated", estimated), { count: estimated })}
        </p>
      )}
      {unmeasured > 0 && (
        <p data-testid="usage-unmeasured" className="m-0">
          {t(pluralKey("usage.unmeasured", unmeasured), { count: unmeasured })}
        </p>
      )}
    </div>
  );
}
