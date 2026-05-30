import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("should render an accessible switch reflecting the checked state", () => {
    // Arrange
    render(
      <Toggle checked aria-label="Auto zones" onCheckedChange={vi.fn()} />
    );

    // Act
    const toggle = screen.getByRole("switch", { name: "Auto zones" });

    // Assert
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(toggle).toHaveClass("bg-primary-500");
  });

  it("should render the off state with the elevated track", () => {
    // Arrange
    render(
      <Toggle
        checked={false}
        aria-label="Auto zones"
        onCheckedChange={vi.fn()}
      />
    );

    // Act
    const toggle = screen.getByRole("switch");

    // Assert
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toHaveClass("bg-surface-elevated");
  });

  it("should invoke onCheckedChange with the negated value on click", () => {
    // Arrange
    const onCheckedChange = vi.fn();
    render(
      <Toggle
        checked={false}
        aria-label="Auto zones"
        onCheckedChange={onCheckedChange}
      />
    );

    // Act
    fireEvent.click(screen.getByRole("switch"));

    // Assert
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("should stop click propagation so it can nest inside a row", () => {
    // Arrange
    const onRowClick = vi.fn();
    render(
      <button type="button" onClick={onRowClick}>
        <Toggle
          checked={false}
          aria-label="Auto zones"
          onCheckedChange={vi.fn()}
        />
      </button>
    );

    // Act
    fireEvent.click(screen.getByRole("switch"));

    // Assert
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("should not toggle when disabled", () => {
    // Arrange
    const onCheckedChange = vi.fn();
    render(
      <Toggle
        checked={false}
        disabled
        aria-label="Auto zones"
        onCheckedChange={onCheckedChange}
      />
    );

    // Act
    fireEvent.click(screen.getByRole("switch"));

    // Assert
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
