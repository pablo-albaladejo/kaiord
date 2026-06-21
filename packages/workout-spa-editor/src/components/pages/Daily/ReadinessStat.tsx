import { Icon, ICON_MAP } from "../../atoms/Icon";
import type { ReadinessMetric } from "./today-readiness";

export type ReadinessStatProps = {
  metric: ReadinessMetric;
};

export function ReadinessStat({ metric }: ReadinessStatProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-1">
        <span className="text-[20px] font-bold tabular-nums text-slate-50">
          {metric.value}
        </span>
        {metric.trend !== undefined && (
          <span className="inline-flex items-center gap-px text-[11px] font-semibold text-emerald-400">
            <Icon icon={ICON_MAP.arrowUp} size="xs" color="inherit" />
            {metric.trend}
          </span>
        )}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mt-px">
        {metric.label}
      </div>
    </div>
  );
}
