import { DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useId } from "react";

import { TREND_METRICS, type TrendMetricKey } from "./trend-metrics";
import { TrendOverlayPane } from "./TrendOverlayPane";
import { useOverlayPaneDnd } from "./use-overlay-pane-dnd";
import { useOverlayPaneOrder } from "./use-overlay-pane-order";
import type { TrendSeriesByMetric } from "./use-trend-series";

const EMPTY_MSG = "Select at least one metric to see its trend.";

const BY_KEY: Record<TrendMetricKey, (typeof TREND_METRICS)[number]> =
  Object.fromEntries(TREND_METRICS.map((m) => [m.key, m])) as Record<
    TrendMetricKey,
    (typeof TREND_METRICS)[number]
  >;

export type TrendOverlayCardProps = {
  selected: ReadonlySet<TrendMetricKey>;
  series: TrendSeriesByMetric;
  rangeDays: number;
  syncKeyOverride?: string;
};

export const TrendOverlayCard = ({
  selected,
  series,
  rangeDays,
  syncKeyOverride,
}: TrendOverlayCardProps) => {
  const autoKey = useId();
  const syncKey = syncKeyOverride ?? autoKey;
  const { paneOrder, reorder } = useOverlayPaneOrder(selected);
  const { sensors, sortableIds, handleDragEnd } = useOverlayPaneDnd({
    paneOrder,
    reorder,
  });

  if (selected.size === 0)
    return <p className="text-sm text-gray-600">{EMPTY_MSG}</p>;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext
        items={sortableIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          data-testid="trend-overlay-card"
          className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 dark:border-slate-800"
        >
          {paneOrder.map((k) => (
            <TrendOverlayPane
              key={k}
              metric={BY_KEY[k]}
              points={series[k].points}
              loading={series[k].loading}
              syncKey={syncKey}
              rangeDays={rangeDays}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
