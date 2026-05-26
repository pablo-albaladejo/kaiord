import type { DraggableSyntheticListeners } from "@dnd-kit/core";

import type { TrendMetricDef } from "./trend-metrics";

export type TrendOverlayPaneHeaderProps = {
  metric: TrendMetricDef;
  dragHandleProps: DraggableSyntheticListeners;
};

export const TrendOverlayPaneHeader = ({
  metric,
  dragHandleProps,
}: TrendOverlayPaneHeaderProps) => (
  <div className="mb-1 flex items-center gap-2">
    <button
      type="button"
      aria-label={`Reorder pane: ${metric.label}`}
      className="cursor-grab touch-none px-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
      {...dragHandleProps}
    >
      ⋮⋮
    </button>
    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
      {metric.label}
    </h2>
    <span className="text-xs text-gray-500 dark:text-slate-400">
      ({metric.unit})
    </span>
  </div>
);
