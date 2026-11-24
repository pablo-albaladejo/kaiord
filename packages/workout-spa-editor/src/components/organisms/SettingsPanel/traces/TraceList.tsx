import { useActiveLocale } from "../../../../i18n/LocaleProvider";
import { useTranslate } from "../../../../i18n/use-translate";
import type { TraceRecord } from "../../../../types/trace-schemas";
import { traceCostText } from "./TraceCost";
import { TraceDetails } from "./TraceDetails";

const whenOf = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));

/** One line per Trace, newest first; opening one shows all it holds. */
export const TraceList = ({ traces }: { traces: TraceRecord[] }) => {
  const t = useTranslate("settings");
  const locale = useActiveLocale();
  return (
    <ul className="space-y-2" data-testid="trace-list">
      {traces.map((trace) => (
        <li key={trace.id} className="rounded-lg border border-edge p-3">
          <details>
            <summary className="cursor-pointer text-sm text-ink-strong">
              {[
                t(`traces.feature.${trace.feature}`),
                whenOf(trace.startedAt, locale),
                t(`traces.outcome.${trace.outcome}`),
                traceCostText(trace, locale, t("traces.costUnknown")),
              ].join(" · ")}
            </summary>
            <TraceDetails trace={trace} />
          </details>
        </li>
      ))}
    </ul>
  );
};
