import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TrendMetricKey } from "./trend-metrics";
import { TrendChartsGrid } from "./TrendChartsGrid";
import type { TrendSeriesByMetric } from "./use-trend-series";

vi.mock("./UplotChart", () => ({
  UplotChart: () => <div data-testid="uplot-chart" />,
}));

const point = { x: 1, y: 1 };

const series: TrendSeriesByMetric = {
  sleep: { points: [point], loading: false },
  hrv: { points: [point], loading: false },
  weight: { points: [point], loading: false },
  steps: { points: [point], loading: false },
};

describe("TrendChartsGrid", () => {
  it("should prompt to pick a metric when none are selected", () => {
    // Arrange
    const selected = new Set<TrendMetricKey>();

    // Act
    render(<TrendChartsGrid selected={selected} series={series} />);

    // Assert
    expect(
      screen.getByText("Select at least one metric to see its trend.")
    ).toBeInTheDocument();
  });

  it("should render a card for each selected metric", () => {
    // Arrange
    const selected = new Set<TrendMetricKey>(["hrv", "steps"]);

    // Act
    render(<TrendChartsGrid selected={selected} series={series} />);

    // Assert
    expect(screen.getByTestId("trend-card-hrv")).toBeInTheDocument();
    expect(screen.getByTestId("trend-card-steps")).toBeInTheDocument();
  });
});
