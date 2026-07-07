import type { LabReport, LabValue } from "@kaiord/core";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LabReportDetail } from "../../../../application/lab/lab-queries";
import { LabReportReview } from "./LabReportReview";

const report: LabReport = {
  id: "r1",
  profileId: "p1",
  date: "2026-03-05",
  labName: "Quest",
  provenance: { source: "manual" },
};

const value = (
  overrides: Partial<LabValue> & Pick<LabValue, "id">
): LabValue => ({
  profileId: "p1",
  reportId: "r1",
  parameterKey: "glucose",
  date: "2026-03-05",
  valueRaw: 95,
  unitRaw: "mg/dL",
  valueCanonical: 95,
  unitCanonical: "mg/dL",
  refSource: "catalog",
  flag: "in",
  provenance: { source: "manual" },
  ...overrides,
});

describe("LabReportReview", () => {
  it("should render every parameter with its range origin (DoD-3)", () => {
    // Arrange
    const detail: LabReportDetail = {
      report,
      values: [
        value({ id: "v1" }),
        value({
          id: "v2",
          parameterKey: "creatinine",
          refSource: "report",
          refLowCanonical: 0.6,
          refHighCanonical: 1.1,
          flag: "high",
          valueCanonical: 1.4,
        }),
      ],
    };

    // Act
    render(<LabReportReview detail={detail} />);

    // Assert
    expect(screen.getAllByTestId("lab-review-value")).toHaveLength(2);
    expect(screen.getByText(/catalog fallback/)).toBeInTheDocument();
    expect(screen.getByText(/from report/)).toBeInTheDocument();
  });

  it("should flag an out-of-range parameter as high (F3.3)", () => {
    // Arrange
    const detail: LabReportDetail = {
      report,
      values: [
        value({
          id: "v2",
          parameterKey: "creatinine",
          refSource: "report",
          refHighCanonical: 1.1,
          flag: "high",
          valueCanonical: 1.4,
        }),
      ],
    };

    // Act
    render(<LabReportReview detail={detail} />);

    // Assert
    const row = screen.getByTestId("lab-review-value");
    expect(row).toHaveAttribute("data-flag", "high");
    expect(within(row).getByTestId("lab-flag-badge")).toHaveTextContent("High");
  });
});
