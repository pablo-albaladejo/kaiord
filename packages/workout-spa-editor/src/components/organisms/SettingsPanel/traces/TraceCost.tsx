import { useActiveLocale } from "../../../../i18n/LocaleProvider";
import { useTranslate } from "../../../../i18n/use-translate";
import type { TraceRecord } from "../../../../types/trace-schemas";
import { formatUsageCost } from "../format-usage-cost";

export const traceCostText = (
  trace: TraceRecord,
  locale: string,
  unknown: string
): string =>
  trace.totalUsd === null ? unknown : formatUsageCost(trace.totalUsd, locale);

/** The run's cost, priced per model, and the tokens it was priced on. */
export const TraceCost = ({ trace }: { trace: TraceRecord }) => {
  const t = useTranslate("settings");
  const locale = useActiveLocale();
  const input = trace.cost.reduce((n, c) => n + c.usage.promptTokens, 0);
  const output = trace.cost.reduce((n, c) => n + c.usage.completionTokens, 0);
  return (
    <>
      {traceCostText(trace, locale, t("traces.costUnknown"))}
      {" · "}
      {t("traces.tokens", {
        input: input.toLocaleString(locale),
        output: output.toLocaleString(locale),
      })}
    </>
  );
};
