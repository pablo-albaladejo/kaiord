import type { LabValue } from "@kaiord/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LabParameterChart } from "./LabParameterChart";

vi.mock("../../../../charts/uplot-base/uplot-chart", () => ({
  UplotChart: () => <div data-testid="uplot-chart-mock" />,
}));

const value = (
  overrides: Partial<LabValue> & Pick<LabValue, "id" | "date">
): LabValue => ({
  profileId: "p1",
  reportId: "r1",
  parameterKey: "vitamin_d",
  valueRaw: 1,
  unitRaw: "ng/mL",
  valueCanonical: 24,
  unitCanonical: "ng/mL",
  refSource: "report",
  flag: "in",
  provenance: { source: "manual" },
  ...overrides,
});

describe("LabParameterChart", () => {
  it("should render the chart with a band and marked outliers from canonical data", () => {
    // Arrange
    const values = [
      value({ id: "v1", date: "2026-01-01", valueCanonical: 45, flag: "in" }),
      value({
        id: "v2",
        date: "2026-03-01",
        valueCanonical: 24,
        flag: "low",
        refLowCanonical: 30,
        refHighCanonical: 50,
      }),
    ];

    // Act
    render(<LabParameterChart parameterKey="vitamin_d" values={values} />);

    // Assert
    const chart = screen.getByTestId("lab-parameter-chart");
    expect(chart).toHaveAttribute("data-has-band", "true");
    expect(chart).toHaveAttribute("data-point-count", "2");
    expect(chart).toHaveAttribute("data-outlier-count", "1");
    expect(screen.getByTestId("uplot-chart-mock")).toBeInTheDocument();
  });

  it("should render the empty message with no values", () => {
    // Arrange
    const values: LabValue[] = [];

    // Act
    render(<LabParameterChart parameterKey="vitamin_d" values={values} />);

    // Assert
    expect(
      screen.getByText("No history for this parameter yet.")
    ).toBeInTheDocument();
  });
});
