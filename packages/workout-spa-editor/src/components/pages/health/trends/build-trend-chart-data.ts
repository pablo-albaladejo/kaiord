import type uPlot from "uplot";

import type { TrendMetricKey } from "./trend-metrics";
import type { TrendPoint } from "./trend-series";

export type PerMetricPoints = Record<TrendMetricKey, ReadonlyArray<TrendPoint>>;

export const buildTrendChartData = (
  presentKeys: ReadonlyArray<TrendMetricKey>,
  seriesByKey: PerMetricPoints
): uPlot.AlignedData => {
  const xs = new Set<number>();
  for (const k of presentKeys) for (const p of seriesByKey[k]) xs.add(p.x);
  const xArr = [...xs].sort((a, b) => a - b);

  const ys = presentKeys.map((k) => {
    const map = new Map<number, number>();
    for (const p of seriesByKey[k]) map.set(p.x, p.y);
    return xArr.map((x) => (map.has(x) ? (map.get(x) as number) : null));
  });

  return [xArr, ...ys] as uPlot.AlignedData;
};
