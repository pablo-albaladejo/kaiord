import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  TREND_METRICS,
  type TrendMetricDef,
  type TrendMetricKey,
} from "./trend-metrics";
import { TrendOverlayPane } from "./TrendOverlayPane";

vi.mock("./UplotChart", () => ({
  UplotChart: () => <div data-testid="uplot-chart" />,
}));

const byKey = (k: TrendMetricKey): TrendMetricDef =>
  TREND_METRICS.find((m) => m.key === k) as TrendMetricDef;

const Wrapper = ({ children }: { children: ReactNode }) => (
  <DndContext>
    <SortableContext items={["sleep", "hrv", "weight", "steps"]}>
      {children}
    </SortableContext>
  </DndContext>
);

describe("TrendOverlayPane", () => {
  it("should render the canvas when non-empty data is provided and not loading", () => {
    // Arrange
    const metric = byKey("sleep");

    // Act
    render(
      <Wrapper>
        <TrendOverlayPane
          metric={metric}
          points={[{ x: 1, y: 1 }]}
          loading={false}
          syncKey="k"
          rangeDays={30}
        />
      </Wrapper>
    );

    // Assert
    expect(screen.getByTestId("uplot-chart")).toBeInTheDocument();
  });

  it("should render the empty placeholder when no points are provided", () => {
    // Arrange
    const metric = byKey("weight");

    // Act
    render(
      <Wrapper>
        <TrendOverlayPane
          metric={metric}
          points={[]}
          loading={false}
          syncKey="k"
          rangeDays={90}
        />
      </Wrapper>
    );

    // Assert
    expect(screen.getByTestId("trend-empty-weight")).toBeInTheDocument();
  });

  it("should render the loading message when loading and empty", () => {
    // Arrange
    const metric = byKey("hrv");

    // Act
    render(
      <Wrapper>
        <TrendOverlayPane
          metric={metric}
          points={[]}
          loading={true}
          syncKey="k"
          rangeDays={30}
        />
      </Wrapper>
    );

    // Assert
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("should not render a border class on the pane wrapper", () => {
    // Arrange
    const metric = byKey("sleep");

    // Act
    render(
      <Wrapper>
        <TrendOverlayPane
          metric={metric}
          points={[{ x: 1, y: 1 }]}
          loading={false}
          syncKey="k"
          rangeDays={30}
        />
      </Wrapper>
    );
    const wrapper = screen.getByTestId("trend-card-sleep");

    // Assert
    expect(wrapper.className).not.toMatch(/\bborder(\b|-)/);
  });
});
