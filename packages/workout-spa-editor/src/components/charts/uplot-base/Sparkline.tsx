/**
 * Sparkline — a tiny uPlot line over a point series. Renders nothing when the
 * series is empty so callers can drop it in a list cell unconditionally.
 */
import { useMemo } from "react";

import {
  buildSparklineData,
  buildSparklineOptions,
  type SparklinePoint,
} from "./build-sparkline";
import { UplotChart } from "./uplot-chart";

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 28;

export type SparklineProps = {
  points: readonly SparklinePoint[];
  width?: number;
  height?: number;
  stroke?: string;
};

export const Sparkline = ({
  points,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  stroke,
}: SparklineProps) => {
  const options = useMemo(
    () => buildSparklineOptions({ width, height, stroke }),
    [width, height, stroke]
  );
  const data = useMemo(() => buildSparklineData(points), [points]);

  if (points.length === 0) return null;
  return (
    <div data-testid="sparkline" data-points={points.length}>
      <UplotChart options={options} data={data} width={width} height={height} />
    </div>
  );
};
