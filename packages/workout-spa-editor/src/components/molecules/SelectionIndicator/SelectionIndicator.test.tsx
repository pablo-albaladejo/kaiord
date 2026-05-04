import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SelectionIndicator } from "./SelectionIndicator";

describe("SelectionIndicator", () => {
  it("should render when selected is true", () => {
    // Arrange

    // Act

    render(<SelectionIndicator selected={true} />);

    // Assert

    expect(screen.getByTestId("selection-indicator")).toBeInTheDocument();
  });

  it("should not render when selected is false", () => {
    // Arrange

    // Act

    render(<SelectionIndicator selected={false} />);

    // Assert

    expect(screen.queryByTestId("selection-indicator")).not.toBeInTheDocument();
  });

  it("should have aria-hidden attribute for accessibility", () => {
    // Arrange

    render(<SelectionIndicator selected={true} />);

    // Act

    const indicator = screen.getByTestId("selection-indicator");

    // Assert

    expect(indicator).toHaveAttribute("aria-hidden", "true");
  });
});
