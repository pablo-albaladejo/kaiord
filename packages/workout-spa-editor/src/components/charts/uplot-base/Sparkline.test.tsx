import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SparklinePoint } from "./build-sparkline";
import { Sparkline } from "./Sparkline";

vi.mock("./uplot-chart", () => ({
  UplotChart: () => <div data-testid="uplot-chart-mock" />,
}));

const POINTS: SparklinePoint[] = [
  { x: 100, y: 10 },
  { x: 200, y: 20 },
];

describe("Sparkline", () => {
  it("should render the chart when the series has points", () => {
    // Arrange
    const points = POINTS;

    // Act
    render(<Sparkline points={points} />);

    // Assert
    expect(screen.getByTestId("sparkline")).toBeInTheDocument();
    expect(screen.getByTestId("uplot-chart-mock")).toBeInTheDocument();
  });

  it("should render nothing for an empty series", () => {
    // Arrange
    const points: SparklinePoint[] = [];

    // Act
    render(<Sparkline points={points} />);

    // Assert
    expect(screen.queryByTestId("sparkline")).not.toBeInTheDocument();
  });
});
