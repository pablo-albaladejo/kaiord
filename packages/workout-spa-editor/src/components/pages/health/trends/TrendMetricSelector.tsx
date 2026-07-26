import { useTranslate } from "../../../../i18n/use-translate";
import type { TrendMetricKey } from "./trend-metrics";
import { TREND_METRICS } from "./trend-metrics";

export type TrendMetricSelectorProps = {
  selected: ReadonlySet<TrendMetricKey>;
  onToggle: (key: TrendMetricKey) => void;
};

const baseClass = "rounded-full border px-3 py-1 text-sm transition-colors";
const onClass = "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950";
const offClass =
  "border-gray-300 text-gray-600 dark:border-slate-700 dark:text-gray-400";

export const TrendMetricSelector = ({
  selected,
  onToggle,
}: TrendMetricSelectorProps) => {
  const t = useTranslate("health");
  return (
    <fieldset
      className="flex flex-wrap gap-2"
      data-testid="trend-metric-select"
    >
      <legend className="sr-only">{t("trends.metricsLegend")}</legend>
      {TREND_METRICS.map((m) => {
        const isOn = selected.has(m.key);
        return (
          <button
            key={m.key}
            type="button"
            aria-pressed={isOn}
            onClick={() => onToggle(m.key)}
            className={`${baseClass} ${isOn ? onClass : offClass}`}
          >
            {t(`trends.metric.${m.key}`)}
          </button>
        );
      })}
    </fieldset>
  );
};
