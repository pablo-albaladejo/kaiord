import "uplot/dist/uPlot.min.css";

import { useEffect, useRef } from "react";
import type uPlot from "uplot";
import UPlot from "uplot";

export type UplotChartProps = {
  options: uPlot.Options;
  data: uPlot.AlignedData;
  width: number;
  height: number;
};

export const UplotChart = ({
  options,
  data,
  width,
  height,
}: UplotChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<uPlot | null>(null);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;
    const chart = new UPlot({ ...options, width, height }, data, target);
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
    // Recreate only when the structural options identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  useEffect(() => {
    chartRef.current?.setData(data);
  }, [data]);

  useEffect(() => {
    chartRef.current?.setSize({ width, height });
  }, [width, height]);

  return <div ref={containerRef} data-testid="uplot-chart" />;
};
