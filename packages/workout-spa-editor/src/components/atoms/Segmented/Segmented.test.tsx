import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Segmented, type SegmentedOption } from "./Segmented";

type Sport = "cycling" | "running" | "swimming";

const OPTIONS: SegmentedOption<Sport>[] = [
  { value: "cycling", label: "Cycling", icon: "bike" },
  { value: "running", label: "Running", icon: "run" },
  { value: "swimming", label: "Swim", icon: "swim" },
];

describe("Segmented", () => {
  it("should render a radiogroup with one radio per option", () => {
    // Arrange
    render(
      <Segmented
        options={OPTIONS}
        value="cycling"
        onChange={vi.fn()}
        ariaLabel="Sport"
      />
    );

    // Act
    const group = screen.getByRole("radiogroup", { name: "Sport" });

    // Assert
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(OPTIONS.length);
  });

  it("should mark the active option as checked", () => {
    // Arrange
    render(
      <Segmented
        options={OPTIONS}
        value="running"
        onChange={vi.fn()}
        ariaLabel="Sport"
      />
    );

    // Act
    const running = screen.getByRole("radio", { name: /running/i });

    // Assert
    expect(running).toHaveAttribute("aria-checked", "true");
    expect(running).toHaveClass("bg-primary-500");
  });

  it("should call onChange with the selected value", () => {
    // Arrange
    const onChange = vi.fn();
    render(
      <Segmented
        options={OPTIONS}
        value="cycling"
        onChange={onChange}
        ariaLabel="Sport"
      />
    );

    // Act
    fireEvent.click(screen.getByRole("radio", { name: /swim/i }));

    // Assert
    expect(onChange).toHaveBeenCalledWith("swimming");
  });
});
