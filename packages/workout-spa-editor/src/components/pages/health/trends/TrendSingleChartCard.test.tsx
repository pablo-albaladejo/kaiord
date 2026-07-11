import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "../../../../contexts/ThemeContext";
import type { TrendMetricKey } from "./trend-metrics";
import { TrendSingleChartCard } from "./TrendSingleChartCard";
import type { TrendSeriesByMetric } from "./use-trend-series";

type UplotMockProps = {
  options: unknown;
  data: unknown;
  width: number;
  height: number;
};
const { uplotMock } = vi.hoisted(() => ({
  uplotMock: vi.fn<(props: UplotMockProps) => void>(),
}));
vi.mock("./UplotChart", () => ({
  UplotChart: (props: UplotMockProps) => {
    uplotMock(props);
    return (
      <div
        data-testid="uplot-chart-mock"
        data-width={props.width}
        data-height={props.height}
      />
    );
  },
}));

beforeEach(() => uplotMock.mockClear());

const X_FIRST = 100;
const X_SECOND = 200;
const Y_SLEEP_FIRST = 80;
const Y_SLEEP_SECOND = 82;
const Y_HRV_FIRST = 55;
const Y_HRV_SECOND = 60;

const EMPTY_SERIES: TrendSeriesByMetric = {
  sleep: { points: [], loading: false },
  hrv: { points: [], loading: false },
  weight: { points: [], loading: false },
  steps: { points: [], loading: false },
};

const POINTS: TrendSeriesByMetric = {
  sleep: {
    points: [
      { x: X_FIRST, y: Y_SLEEP_FIRST },
      { x: X_SECOND, y: Y_SLEEP_SECOND },
    ],
    loading: false,
  },
  hrv: {
    points: [
      { x: X_FIRST, y: Y_HRV_FIRST },
      { x: X_SECOND, y: Y_HRV_SECOND },
    ],
    loading: false,
  },
  weight: { points: [], loading: false },
  steps: { points: [], loading: false },
};

const selectedOf = (...keys: TrendMetricKey[]): ReadonlySet<TrendMetricKey> =>
  new Set(keys);

describe("TrendSingleChartCard", () => {
  it("should render the bare empty message when no metric is selected", () => {
    // Arrange
    const selected = selectedOf();

    // Act
    render(
      <TrendSingleChartCard
        selected={selected}
        series={EMPTY_SERIES}
        rangeDays={30}
      />,
      { wrapper: ThemeProvider }
    );

    // Assert
    expect(
      screen.getByText("Select at least one metric to see its trend.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("uplot-chart-mock")).not.toBeInTheDocument();
  });

  it("should render Loading… (not empty-state literal) while any selected metric is loading with zero points", () => {
    // Arrange
    const selected = selectedOf("sleep");
    const loadingSeries: TrendSeriesByMetric = {
      ...EMPTY_SERIES,
      sleep: { points: [], loading: true },
    };

    // Act
    render(
      <TrendSingleChartCard
        selected={selected}
        series={loadingSeries}
        rangeDays={30}
      />,
      { wrapper: ThemeProvider }
    );

    // Assert
    expect(screen.getByTestId("trend-loading")).toHaveTextContent("Loading…");
    expect(
      screen.queryByText("Select at least one metric to see its trend.")
    ).not.toBeInTheDocument();
  });

  it("should call UplotChart with a new options object identity when rangeDays changes", () => {
    // Arrange
    const selected = selectedOf("sleep", "hrv");
    const { rerender } = render(
      <TrendSingleChartCard
        selected={selected}
        series={POINTS}
        rangeDays={30}
      />,
      { wrapper: ThemeProvider }
    );
    const firstCallOptions = uplotMock.mock.calls[0][0].options;

    // Act
    rerender(
      <TrendSingleChartCard
        selected={selected}
        series={POINTS}
        rangeDays={90}
      />
    );

    // Assert
    expect(uplotMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    const lastCallOptions =
      uplotMock.mock.calls[uplotMock.mock.calls.length - 1][0].options;
    expect(lastCallOptions).not.toBe(firstCallOptions);
  });

  it("should not include data for metrics with zero points", () => {
    // Arrange
    const selected = selectedOf("sleep", "weight");

    // Act
    render(
      <TrendSingleChartCard
        selected={selected}
        series={POINTS}
        rangeDays={30}
      />,
      { wrapper: ThemeProvider }
    );

    // Assert
    const lastCall = uplotMock.mock.calls[uplotMock.mock.calls.length - 1][0];
    const data = lastCall.data as ReadonlyArray<ReadonlyArray<unknown>>;
    const EXPECTED_ROWS_X_PLUS_SLEEP = 2;
    expect(data).toHaveLength(EXPECTED_ROWS_X_PLUS_SLEEP);
    expect(data[0]).toEqual([X_FIRST, X_SECOND]);
    expect(data[1]).toEqual([Y_SLEEP_FIRST, Y_SLEEP_SECOND]);
  });

  it("should pass width=880 and height=360 to UplotChart", () => {
    // Arrange
    const selected = selectedOf("sleep");

    // Act
    render(
      <TrendSingleChartCard
        selected={selected}
        series={POINTS}
        rangeDays={30}
      />,
      { wrapper: ThemeProvider }
    );

    // Assert
    const chart = screen.getByTestId("uplot-chart-mock");
    expect(chart).toHaveAttribute("data-width", "880");
    expect(chart).toHaveAttribute("data-height", "360");
  });
});
