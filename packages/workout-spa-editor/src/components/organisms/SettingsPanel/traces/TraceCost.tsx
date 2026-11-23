import { useActiveLocale } from "../../../../i18n/LocaleProvider";
import { pluralKey } from "../../../../i18n/plural-key";
import { useTranslate } from "../../../../i18n/use-translate";
import type { TraceRecord } from "../../../../types/trace-schemas";
import { formatUsageCost } from "../format-usage-cost";

export const traceCostText = (
  trace: TraceRecord,
  locale: string,
  unknown: string
): string =>
  trace.totalUsd === null ? unknown : formatUsageCost(trace.totalUsd, locale);

const countOf = (
  trace: TraceRecord,
  field: "estimatedRequests" | "unmeasuredRequests"
) => trace.cost.reduce((n, c) => n + c[field], 0);

/**
 * The run's cost, priced per model, and the tokens it was priced on; as the
 * Usage tab does, it says when the cost includes an estimate (requests cut
 * before their usage came) and which requests it leaves out (failed before
 * any usage came).
 */
export const TraceCost = ({ trace }: { trace: TraceRecord }) => {
  const t = useTranslate("settings");
  const locale = useActiveLocale();
  const input = trace.cost.reduce((n, c) => n + c.usage.promptTokens, 0);
  const output = trace.cost.reduce((n, c) => n + c.usage.completionTokens, 0);
  const estimated = countOf(trace, "estimatedRequests");
  const unmeasured = countOf(trace, "unmeasuredRequests");
  return (
    <>
      {traceCostText(trace, locale, t("traces.costUnknown"))}
      {estimated > 0 && ` (${t("traces.includesEstimate")})`}
      {" · "}
      {t("traces.tokens", {
        input: input.toLocaleString(locale),
        output: output.toLocaleString(locale),
      })}
      {estimated > 0 && (
        <span className="block text-ink-muted">
          {t(pluralKey("traces.estimated", estimated), { count: estimated })}
        </span>
      )}
      {unmeasured > 0 && (
        <span className="block text-ink-muted">
          {t(pluralKey("traces.unmeasured", unmeasured), { count: unmeasured })}
        </span>
      )}
    </>
  );
};
