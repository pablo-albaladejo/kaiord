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

  it("should apply accent color class when accent is true", () => {
    // Arrange

    render(<Metric value="185" unit="bpm" label="Max HR" accent />);

    // Act

    const value = screen.getByText("185");

    // Assert

    expect(value).toHaveClass("text-sky-400");
  });

  it("should apply default color class when accent is not set", () => {
    // Arrange

    render(<Metric value="95" unit="rpm" label="Cadence" />);

    // Act

    const value = screen.getByText("95");

    // Assert

    expect(value).toHaveClass("text-slate-50");
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
