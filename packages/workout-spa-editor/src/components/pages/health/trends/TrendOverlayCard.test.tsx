import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TrendMetricKey } from "./trend-metrics";
import { TrendOverlayCard } from "./TrendOverlayCard";
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

describe("TrendOverlayCard", () => {
  it("should render the empty-selection prompt when no metric is selected", () => {
    // Arrange
    const selected = new Set<TrendMetricKey>();

    // Act
    render(
      <TrendOverlayCard selected={selected} series={series} rangeDays={30} />
    );

    // Assert
    expect(
      screen.getByText("Select at least one metric to see its trend.")
    ).toBeInTheDocument();
  });

  it("should render one pane per selected metric", () => {
    // Arrange
    const selected = new Set<TrendMetricKey>(["hrv", "steps"]);

    // Act
    render(
      <TrendOverlayCard selected={selected} series={series} rangeDays={30} />
    );

    // Assert
    expect(screen.getByTestId("trend-card-hrv")).toBeInTheDocument();
    expect(screen.getByTestId("trend-card-steps")).toBeInTheDocument();
  });

  it("should render the container with the tight gap-2 class for visual tightness", () => {
    // Arrange
    const selected = new Set<TrendMetricKey>(["sleep"]);

    // Act
    render(
      <TrendOverlayCard selected={selected} series={series} rangeDays={30} />
    );
    const container = screen.getByTestId("trend-overlay-card");

    // Assert
    expect(container.className).toContain("gap-2");
  });

  it("should render the outer card with a border but no border on individual panes", () => {
    // Arrange
    const selected = new Set<TrendMetricKey>(["sleep"]);

    // Act
    render(
      <TrendOverlayCard selected={selected} series={series} rangeDays={30} />
    );
    const container = screen.getByTestId("trend-overlay-card");
    const pane = screen.getByTestId("trend-card-sleep");

    // Assert
    expect(container.className).toMatch(/\bborder(\b|-)/);
    expect(pane.className).not.toMatch(/\bborder(\b|-)/);
  });
});
