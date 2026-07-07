import type { LabValue } from "@kaiord/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { LabParameterSummary } from "./build-lab-parameter-summaries";
import { LabLatestValuesList } from "./LabLatestValuesList";

vi.mock("../../../charts/uplot-base/uplot-chart", () => ({
  UplotChart: () => <div data-testid="uplot-chart-mock" />,
}));

const latest = (overrides: Partial<LabValue>): LabValue => ({
  id: "v1",
  profileId: "p1",
  reportId: "r1",
  parameterKey: "glucose",
  date: "2026-03-01",
  valueRaw: 95,
  unitRaw: "mg/dL",
  valueCanonical: 95,
  unitCanonical: "mg/dL",
  refSource: "catalog",
  flag: "in",
  provenance: { source: "manual" },
  ...overrides,
});

const summary = (
  key: string,
  flag: LabValue["flag"],
  points: number[]
): LabParameterSummary => ({
  parameterKey: key,
  latest: latest({ parameterKey: key, flag }),
  points: points.map((x) => ({ x, y: 1 })),
});

describe("LabLatestValuesList", () => {
  it("should render a sparkline for each parameter with history", () => {
    // Arrange
    const summaries = [
      summary("glucose", "in", [100, 200]),
      summary("creatinine", "high", [100, 200]),
    ];

    // Act
    render(<LabLatestValuesList summaries={summaries} />);

    // Assert
    expect(screen.getAllByTestId("lab-parameter-item")).toHaveLength(2);
    expect(screen.getAllByTestId("sparkline")).toHaveLength(2);
  });

  it("should mark an out-of-range parameter with its flag (F3.3)", () => {
    // Arrange
    const summaries = [summary("creatinine", "high", [100, 200])];

    // Act
    render(<LabLatestValuesList summaries={summaries} />);

    // Assert
    const item = screen.getByTestId("lab-parameter-item");
    expect(item).toHaveAttribute("data-flag", "high");
    expect(screen.getByTestId("lab-flag-badge")).toHaveTextContent("High");
  });

  it("should show the empty message with no summaries", () => {
    // Arrange
    const summaries: LabParameterSummary[] = [];

    // Act
    render(<LabLatestValuesList summaries={summaries} />);

    // Assert
    expect(
      screen.getByText("No lab parameters recorded yet.")
    ).toBeInTheDocument();
  });
});
