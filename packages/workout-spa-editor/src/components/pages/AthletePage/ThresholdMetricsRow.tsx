import { useTranslate } from "../../../i18n/use-translate";
import type { ThresholdMetric } from "../../../lib/athlete";
import { Metric } from "../../molecules/Metric";
import { ThresholdProvenanceLine } from "./ThresholdProvenanceLine";

type ThresholdMetricsRowProps = {
  metrics: ThresholdMetric[];
  sportLabel: string;
};

export function ThresholdMetricsRow({
  metrics,
  sportLabel,
}: ThresholdMetricsRowProps) {
  const t = useTranslate("athlete");

  if (metrics.length === 0) {
    return (
      <p className="text-[13px] text-ink-muted">
        {t("noThresholds", { sport: sportLabel.toLowerCase() })}
      </p>
    );
  }

  return (
    <div className="flex gap-3.5">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex min-w-0 flex-1 flex-col gap-[5px]"
        >
          <Metric
            value={metric.value}
            unit={metric.unit}
            label={metric.label}
          />
          <ThresholdProvenanceLine provenance={metric.provenance} />
        </div>
      ))}
    </div>
  );
}
