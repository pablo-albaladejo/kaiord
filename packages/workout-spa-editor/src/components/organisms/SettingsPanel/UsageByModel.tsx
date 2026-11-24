/**
 * The Usage tab's cost by model: one row per Provider and model, with its
 * runs, the failed attempts that were billed, tokens, cost and the prices the
 * cost was computed from. A model with no price shows "Price unknown" and
 * adds nothing to the cost.
 */
import type { ModelUsage } from "../../../application/usage/fold-usage-events";
import { priceBasisOf } from "../../../application/usage/price-basis";
import { useModelName } from "../../../hooks/use-model-name";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { formatUsageCost } from "./format-usage-cost";
import { PriceBasisText } from "./PriceBasisText";

const HEAD = "py-2 pr-2 font-medium sm:pr-4";
const CELL = "py-2 pr-2 align-top text-ink-strong sm:pr-4";
const WIDE = "hidden sm:table-cell";

const rowId = (m: ModelUsage) =>
  `usage-model-${m.providerType ?? "unknown"}-${m.modelId ?? "unknown"}`;

function ModelRow({ usage }: { usage: ModelUsage }) {
  const t = useTranslate("settings");
  const name = useModelName();
  const locale = useActiveLocale();
  const basis = priceBasisOf(usage.providerType, usage.modelId);
  const priced = usage.totals.unknownCostRuns < usage.totals.runs;
  return (
    <tr data-testid={rowId(usage)} className="border-b border-edge-soft">
      <td className={CELL}>
        {usage.modelId
          ? name(usage.providerType, usage.modelId)
          : t("usage.byModel.unknownModel")}
      </td>
      <td className={`${CELL} ${WIDE}`}>{usage.totals.runs}</td>
      <td className={`${CELL} ${WIDE}`}>{usage.totals.failedRequests}</td>
      <td className={`${CELL} ${WIDE}`}>
        {usage.totals.totalTokens.toLocaleString(locale)}
      </td>
      <td className={CELL}>
        {priced ? formatUsageCost(usage.totals.totalCost, locale) : "—"}
        {priced && usage.totals.estimatedRequests > 0 && (
          <span className="block text-ink-muted">
            {t("usage.includesEstimate")}
          </span>
        )}
      </td>
      <td className={`${CELL} text-ink-muted`}>
        <PriceBasisText basis={basis} />
      </td>
    </tr>
  );
}

export function UsageByModel({
  models,
  monthsWindow,
}: {
  models: ModelUsage[];
  monthsWindow: number;
}) {
  const t = useTranslate("settings");
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-ink-strong">
        {t("usage.byModel.heading", { count: monthsWindow })}
      </h3>
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-edge text-left text-ink-muted">
            <th className={HEAD}>{t("usage.byModel.model")}</th>
            <th className={`${HEAD} ${WIDE}`}>{t("usage.byModel.runs")}</th>
            <th className={`${HEAD} ${WIDE}`}>{t("usage.byModel.failed")}</th>
            <th className={`${HEAD} ${WIDE}`}>{t("usage.byModel.tokens")}</th>
            <th className={HEAD}>{t("usage.byModel.cost")}</th>
            <th className={HEAD}>{t("usage.byModel.price")}</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <ModelRow key={rowId(m)} usage={m} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
