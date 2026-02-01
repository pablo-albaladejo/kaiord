import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SelectionIndicator } from "./SelectionIndicator";

describe("SelectionIndicator", () => {
  it("renders when selected is true", () => {
    render(<SelectionIndicator selected={true} />);

    expect(screen.getByTestId("selection-indicator")).toBeInTheDocument();
  });

  it("does not render when selected is false", () => {
    render(<SelectionIndicator selected={false} />);

    expect(screen.queryByTestId("selection-indicator")).not.toBeInTheDocument();
  });

  it("has aria-hidden attribute for accessibility", () => {
    render(<SelectionIndicator selected={true} />);

    const indicator = screen.getByTestId("selection-indicator");
    expect(indicator).toHaveAttribute("aria-hidden", "true");
  });
});
