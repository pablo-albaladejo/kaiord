import type uPlot from "uplot";

import { formatPaneValue } from "./format-pane-value";
import type { TrendMetricDef } from "./trend-metrics";

const STROKE = "#2563eb";
const GRID = "#e5e7eb";

// Shared X-axis config across panes so ticks line up vertically under the
// synchronized cursor (VT1). Static — same incrs/space/values for every pane.
const SHARED_X_AXIS: uPlot.Axis = { grid: { stroke: GRID } };

export const buildPaneOptions = (
  metric: TrendMetricDef,
  width: number,
  height: number,
  syncKey: string
): uPlot.Options => ({
  width,
  height,
  scales: { x: { time: true } },
  axes: [SHARED_X_AXIS, { grid: { stroke: GRID } }],
  cursor: {
    sync: { key: syncKey, setSeries: true },
  },
  legend: { show: true, live: true },
  series: [
    {},
    {
      label: `${metric.label} (${metric.unit})`,
      stroke: STROKE,
      width: 2,
      points: { show: true, size: 4 },
      value: (_u, v) => formatPaneValue(metric, v),
    },
  ],
});
