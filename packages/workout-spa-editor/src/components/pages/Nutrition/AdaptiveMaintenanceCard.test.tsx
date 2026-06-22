import type { AdaptiveTdeeResult } from "@kaiord/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdaptiveMaintenanceCard } from "./AdaptiveMaintenanceCard";

const MAINTENANCE_KCAL = 2487.6;

const result = (
  overrides: Partial<AdaptiveTdeeResult> = {}
): AdaptiveTdeeResult => ({
  maintenanceKcal: MAINTENANCE_KCAL,
  isEstimate: true,
  sufficientData: true,
  ...overrides,
});

describe("AdaptiveMaintenanceCard", () => {
  it("should render the rounded maintenance value when data is sufficient", () => {
    // Arrange
    const adaptive = result();

    // Act
    render(<AdaptiveMaintenanceCard adaptive={adaptive} />);

    // Assert
    expect(screen.getByTestId("adaptive-maintenance")).toBeInTheDocument();
    expect(screen.getByTestId("adaptive-maintenance-value")).toHaveTextContent(
      "2488 kcal"
    );
  });

  it("should hide the card when the estimate lacks sufficient data", () => {
    // Arrange
    const adaptive = result({ sufficientData: false });

    // Act
    render(<AdaptiveMaintenanceCard adaptive={adaptive} />);

    // Assert
    expect(
      screen.queryByTestId("adaptive-maintenance")
    ).not.toBeInTheDocument();
  });

  it("should hide the card when no estimate is available", () => {
    // Arrange
    const adaptive = null;

    // Act
    render(<AdaptiveMaintenanceCard adaptive={adaptive} />);

    // Assert
    expect(
      screen.queryByTestId("adaptive-maintenance")
    ).not.toBeInTheDocument();
  });
});
