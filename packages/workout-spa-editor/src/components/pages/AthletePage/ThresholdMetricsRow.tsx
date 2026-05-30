import type { ThresholdMetric } from "../../../lib/athlete";
import { Metric } from "../../molecules/Metric";

type ThresholdMetricsRowProps = {
  metrics: ThresholdMetric[];
  sportLabel: string;
};

export function ThresholdMetricsRow({
  metrics,
  sportLabel,
}: ThresholdMetricsRowProps) {
  if (metrics.length === 0) {
    return (
      <p className="text-[13.5px] text-slate-400">
        Add your {sportLabel.toLowerCase()} thresholds
      </p>
    );
  }

  return (
    <div className="flex">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={
            index === 0 ? "flex-1" : "flex-1 border-l border-slate-800 pl-4"
          }
        >
          <Metric
            value={metric.value}
            unit={metric.unit}
            label={metric.label}
            accent={metric.accent}
          />
        </div>
      ))}
    </div>
  );
}
