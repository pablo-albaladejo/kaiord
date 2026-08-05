import { useTranslate } from "../../../../i18n/use-translate";
import { seriesStroke } from "../../../charts/uplot-base/series-strokes";
import type { TrendMetricDef, TrendMetricKey } from "./trend-metrics";
import { TREND_METRICS } from "./trend-metrics";

export type TrendMetricSelectorProps = {
  selected: ReadonlySet<TrendMetricKey>;
  onToggle: (key: TrendMetricKey) => void;
};

const baseClass =
  "flex items-center gap-[7px] rounded-full border px-3 py-1 text-sm font-medium transition-colors";
const onClass = "border-edge-strong text-ink-strong";
const offClass = "border-edge-soft text-ink-muted hover:border-edge";

const swatchBackground = (metric: TrendMetricDef): string => {
  const stroke = seriesStroke(metric.strokeStep);
  return metric.dash
    ? `repeating-linear-gradient(to right, ${stroke} 0 4px, transparent 4px 7px)`
    : stroke;
};

/* The swatch carries the metric's own ladder step and dash, so the chip and
   the canvas name the same series the same way. */
const Swatch = ({ metric }: { metric: TrendMetricDef }) => (
  <span
    aria-hidden="true"
    className="h-0.5 w-3 shrink-0 rounded-sm"
    style={{ background: swatchBackground(metric) }}
  />
);

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
            {isOn && <Swatch metric={m} />}
            {t(`trends.metric.${m.key}`)}
          </button>
        );
      })}
    </fieldset>
  );
};
