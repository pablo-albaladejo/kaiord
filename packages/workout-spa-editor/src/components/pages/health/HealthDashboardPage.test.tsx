import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import HealthDashboardPage from "./HealthDashboardPage";
import type { TrendSeriesByMetric } from "./trends/use-trend-series";

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: "p1", profile: { name: "Athlete" } }),
}));

const point = { x: 1, y: 1 };

const seriesMock: TrendSeriesByMetric = {
  sleep: { points: [point], loading: false },
  hrv: { points: [point], loading: false },
  weight: { points: [], loading: false },
  steps: { points: [point], loading: false },
};

vi.mock("./trends/use-trend-series", () => ({
  useTrendSeries: () => seriesMock,
}));

vi.mock("./trends/UplotChart", () => ({
  UplotChart: () => <div data-testid="uplot-chart" />,
}));

describe("HealthDashboardPage trends hub", () => {
  it("should render the trends hub for the active profile", () => {
    // Arrange
    render(<HealthDashboardPage />);

    // Act
    const heading = screen.getByRole("heading", { name: "Trends" });

    // Assert
    expect(heading).toBeInTheDocument();
    expect(screen.getByText("Athlete")).toBeInTheDocument();
  });

  it("should render metric and range selectors", () => {
    // Arrange
    render(<HealthDashboardPage />);

    // Act
    const metrics = screen.getByTestId("trend-metric-select");
    const range = screen.getByTestId("trend-range-select");

    // Assert
    expect(metrics).toBeInTheDocument();
    expect(range).toBeInTheDocument();
  });

  it("should render a chart only for selected metrics", () => {
    // Arrange
    render(<HealthDashboardPage />);

    // Act
    const sleepCard = screen.queryByTestId("trend-card-sleep");
    const weightCard = screen.queryByTestId("trend-card-weight");

    // Assert
    expect(sleepCard).toBeInTheDocument();
    expect(weightCard).not.toBeInTheDocument();
  });

  it("should add a chart when a metric is selected", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<HealthDashboardPage />);

    // Act
    await user.click(screen.getByRole("button", { name: "Weight" }));

    // Assert
    expect(screen.getByTestId("trend-card-weight")).toBeInTheDocument();
  });

  it("should remove a chart when a selected metric is toggled off", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<HealthDashboardPage />);

    // Act
    await user.click(screen.getByRole("button", { name: "Sleep" }));

    // Assert
    expect(screen.queryByTestId("trend-card-sleep")).not.toBeInTheDocument();
  });

  it("should show a per-metric empty state when a metric has no data", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<HealthDashboardPage />);

    // Act
    await user.click(screen.getByRole("button", { name: "Weight" }));

    // Assert
    expect(screen.getByTestId("trend-empty-weight")).toBeInTheDocument();
  });

  it("should select a different date range", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<HealthDashboardPage />);

    // Act
    await user.click(screen.getByRole("radio", { name: "30d" }));

    // Assert
    expect(screen.getByRole("radio", { name: "30d" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });
});
