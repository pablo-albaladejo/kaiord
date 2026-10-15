import { foldUsageEvents } from "../../../application/usage/fold-usage-events";
import { useUsageSummary } from "../../../hooks/use-usage-summary";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";
import { formatUsageCost } from "./format-usage-cost";

/**
 * This month's AI use in one line: requests, tokens and estimated cost. The
 * usage log is not kept per athlete, so the line says it is the total.
 */
export function AssistantUsage() {
  const t = useTranslate("settings");
  const locale = useActiveLocale();
  const { months, events } = useUsageSummary(1);
  if (!events) return null;
  const month = events.filter((e) => e.yearMonth === months[0]);
  if (month.length === 0) {
    return (
      <p className="m-0 text-sm text-ink-muted">{t("assistant.usageNone")}</p>
    );
  }
  const totals = foldUsageEvents(month);
  const cost = formatUsageCost(totals.totalCost, locale);
  return (
    <p data-testid="assistant-usage" className="m-0 text-sm text-ink-muted">
      {t(pluralKey("assistant.usage", month.length), {
        count: month.length,
        tokens: totals.totalTokens.toLocaleString(locale),
        cost,
      })}
    </p>
  );
}
