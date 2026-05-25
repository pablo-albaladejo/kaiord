import type uPlot from "uplot";

const STROKE = "#2563eb";
const GRID = "#e5e7eb";

export const buildTrendOptions = (
  label: string,
  unit: string,
  width: number,
  height: number
): uPlot.Options => ({
  width,
  height,
  scales: { x: { time: true } },
  axes: [{ grid: { stroke: GRID } }, { grid: { stroke: GRID } }],
  series: [
    {},
    {
      label: `${label} (${unit})`,
      stroke: STROKE,
      width: 2,
      points: { show: true, size: 4 },
    },
  ],
});
