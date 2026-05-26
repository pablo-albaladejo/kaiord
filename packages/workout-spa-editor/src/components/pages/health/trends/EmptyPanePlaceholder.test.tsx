import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyPanePlaceholder } from "./EmptyPanePlaceholder";
import {
  TREND_METRICS,
  type TrendMetricDef,
  type TrendMetricKey,
} from "./trend-metrics";

const byKey = (k: TrendMetricKey): TrendMetricDef =>
  TREND_METRICS.find((m) => m.key === k) as TrendMetricDef;

describe("EmptyPanePlaceholder", () => {
  it("should render the sleep template with the requested day count", () => {
    // Arrange
    const metric = byKey("sleep");

    // Act
    render(<EmptyPanePlaceholder metric={metric} rangeDays={30} />);

    // Assert
    expect(
      screen.getByText(
        "No Sleep data in the last 30 days. Import a FIT or add manually."
      )
    ).toBeInTheDocument();
  });

  it("should render the steps template with a different day count", () => {
    // Arrange
    const metric = byKey("steps");

    // Act
    render(<EmptyPanePlaceholder metric={metric} rangeDays={90} />);

    // Assert
    expect(
      screen.getByText(
        "No Steps data in the last 90 days. Import a FIT or add manually."
      )
    ).toBeInTheDocument();
  });
});
