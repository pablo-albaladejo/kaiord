import { DESTINATIONS } from "../../../../application/data-flows/destinations";
import { listKinds } from "../../../../i18n/list-data-kinds";
import { useActiveLocale } from "../../../../i18n/LocaleProvider";
import { useTranslate } from "../../../../i18n/use-translate";
import type { TraceRecord, TraceSent } from "../../../../types/trace-schemas";
import { TraceCost } from "./TraceCost";

const Row = (props: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap gap-x-2">
    <dt className="text-ink-muted">{props.label}</dt>
    <dd className="m-0 text-ink-body">{props.children}</dd>
  </div>
);

type Translate = ReturnType<typeof useTranslate>;

const sentLine = (s: TraceSent, t: Translate, tf: Translate, locale: string) =>
  t(s.declared ? "traces.sentDeclared" : "traces.sentLine", {
    provider: DESTINATIONS[s.to].name,
    kinds: listKinds(s.kinds, tf, locale),
    declared: listKinds(s.declared ?? [], tf, locale),
  });

/** Everything one Trace holds, in the athlete's words. */
export const TraceDetails = ({ trace }: { trace: TraceRecord }) => {
  const t = useTranslate("settings");
  const tf = useTranslate("dataFlows");
  const locale = useActiveLocale();
  const models = trace.cost.map((c) =>
    [c.provider && DESTINATIONS[c.provider].name, c.modelId]
      .filter(Boolean)
      .join(" ")
  );
  return (
    <dl className="mt-2 space-y-1 text-sm" data-testid="trace-details">
      <Row label={t("traces.model")}>{models.join(", ") || "—"}</Row>
      <Row label={t("traces.unit")}>
        {trace.units.map((u) => u.promptVersion).join(", ") || "—"}
      </Row>
      <Row label={t("traces.latency")}>
        {t("traces.latencyValue", {
          seconds: (trace.latencyMs / 1000).toLocaleString(locale),
        })}
      </Row>
      <Row label={t("traces.calls")}>{trace.modelCalls}</Row>
      <Row label={t("traces.retries")}>{trace.retries}</Row>
      <Row label={t("traces.cost")}>
        <TraceCost trace={trace} />
      </Row>
      <Row label={t("traces.tools")}>
        {trace.tools.length === 0
          ? t("traces.noTools")
          : trace.tools
              .map((tool) =>
                t("traces.toolLine", {
                  name: tool.name,
                  confirmation: t(`traces.confirmation.${tool.confirmation}`),
                  result: t(`traces.result.${tool.result}`),
                })
              )
              .join("; ")}
      </Row>
      <Row label={t("traces.sent")}>
        {trace.sent.length === 0
          ? t("traces.sentNothing")
          : trace.sent.map((s) => sentLine(s, t, tf, locale)).join("; ")}
      </Row>
    </dl>
  );
};
