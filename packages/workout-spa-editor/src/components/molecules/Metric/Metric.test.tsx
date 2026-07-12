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

  it.each([
    {
      accent: true,
      value: "185",
      unit: "bpm",
      label: "Max HR",
      expectedClass: "text-accent",
    },
    {
      accent: undefined,
      value: "95",
      unit: "rpm",
      label: "Cadence",
      expectedClass: "text-ink-strong",
    },
  ])(
    "should color the value $expectedClass when accent is $accent",
    ({ accent, value, unit, label, expectedClass }) => {
      // Arrange

      render(
        <Metric value={value} unit={unit} label={label} accent={accent} />
      );

      // Act

      const el = screen.getByText(value);

      // Assert

      expect(el).toHaveClass(expectedClass);
    }
  );

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
