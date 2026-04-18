import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { UsageEmptyState } from "./UsageEmptyState";

describe("UsageEmptyState", () => {
  it("renders the heading and interpolates the months-window in the body copy", () => {
    render(<UsageEmptyState monthsWindow={6} />);

    expect(screen.getByText("AI Usage")).toBeInTheDocument();
    expect(screen.getByText(/last 6 months/i)).toBeInTheDocument();
  });

  it("interpolates a different window value", () => {
    render(<UsageEmptyState monthsWindow={3} />);

    expect(screen.getByText(/last 3 months/i)).toBeInTheDocument();
  });
});
