import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UsageEmptyState } from "./UsageEmptyState";

describe("UsageEmptyState", () => {
  it("should render the heading and interpolates the months-window in the body copy", () => {
    // Arrange

    // Act

    render(<UsageEmptyState monthsWindow={6} />);

    // Assert

    expect(screen.getByText("AI Usage")).toBeInTheDocument();
    expect(screen.getByText(/last 6 months/i)).toBeInTheDocument();
  });

  it("should interpolate a different window value", () => {
    // Arrange

    // Act

    render(<UsageEmptyState monthsWindow={3} />);

    // Assert

    expect(screen.getByText(/last 3 months/i)).toBeInTheDocument();
  });
});
