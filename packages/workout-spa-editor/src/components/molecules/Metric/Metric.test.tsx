import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Metric } from "./Metric";

describe("Metric", () => {
  it("should render value, unit, and label", () => {
    // Arrange

    render(<Metric value="320" unit="W" label="Avg Power" />);

    // Act

    const value = screen.getByText("320");
    const unit = screen.getByText("W");
    const label = screen.getByText("Avg Power");

    // Assert

    expect(value).toBeInTheDocument();
    expect(unit).toBeInTheDocument();
    expect(label).toBeInTheDocument();
  });

  it("should render the value in the ink role, never an accent", () => {
    // Arrange

    render(<Metric value="185" unit="bpm" label="Max HR" />);

    // Act

    const el = screen.getByText("185");

    // Assert

    expect(el).toHaveClass("text-ink-strong");
    expect(el).not.toHaveClass("text-accent");
  });

  it("should render the value with tabular slashed-zero figures", () => {
    // Arrange

    render(<Metric value="268" unit="W" label="FTP" />);

    // Act

    const el = screen.getByText("268");

    // Assert

    expect(el).toHaveClass("[font-variant-numeric:tabular-nums_slashed-zero]");
  });

  it("should render without unit", () => {
    // Arrange

    render(<Metric value="42" label="Laps" />);

    // Act

    const value = screen.getByText("42");
    const label = screen.getByText("Laps");

    // Assert

    expect(value).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(screen.queryByText(/^W$|^bpm$|^rpm$/)).not.toBeInTheDocument();
  });
});
