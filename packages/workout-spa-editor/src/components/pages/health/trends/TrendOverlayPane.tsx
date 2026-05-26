import { useMemo } from "react";

import { useDndCardWrapper } from "../../../../hooks/use-dnd-card-wrapper";
import { buildPaneOptions } from "./build-pane-options";
import { EmptyPanePlaceholder } from "./EmptyPanePlaceholder";
import type { TrendMetricDef } from "./trend-metrics";
import { toAlignedData, type TrendPoint } from "./trend-series";
import { TrendOverlayPaneHeader } from "./TrendOverlayPaneHeader";
import { UplotChart } from "./UplotChart";

const PANE_WIDTH = 640;
const PANE_HEIGHT = 180;

export type TrendOverlayPaneProps = {
  metric: TrendMetricDef;
  points: TrendPoint[];
  loading: boolean;
  syncKey: string;
  rangeDays: number;
};

export const TrendOverlayPane = ({
  metric,
  points,
  loading,
  syncKey,
  rangeDays,
}: TrendOverlayPaneProps) => {
  const { wrapperProps, dragHandleProps, style } = useDndCardWrapper(
    metric.key
  );
  const options = useMemo(
    () => buildPaneOptions(metric, PANE_WIDTH, PANE_HEIGHT, syncKey),
    [metric, syncKey]
  );
  const data = useMemo(() => toAlignedData(points), [points]);
  const empty = points.length === 0;
  return (
    <div
      {...wrapperProps}
      style={style}
      data-testid={`trend-card-${metric.key}`}
      className="bg-white p-2 dark:bg-slate-900"
    >
      <TrendOverlayPaneHeader
        metric={metric}
        dragHandleProps={dragHandleProps}
      />
      {loading && empty ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : empty ? (
        <EmptyPanePlaceholder metric={metric} rangeDays={rangeDays} />
      ) : (
        <UplotChart
          options={options}
          data={data}
          width={PANE_WIDTH}
          height={PANE_HEIGHT}
        />
      )}
    </div>
  );
};
