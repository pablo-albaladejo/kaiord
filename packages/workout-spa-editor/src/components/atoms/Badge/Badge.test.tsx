import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BadgeSize, BadgeVariant } from "./Badge";
import { Badge } from "./Badge";

describe("Badge", () => {
  describe("variant class map", () => {
    it.each<[BadgeVariant, string, string]>([
      ["default", "bg-gray-100", "text-gray-800"],
      ["warmup", "bg-blue-100", "text-blue-800"],
      ["active", "bg-red-100", "text-red-800"],
      ["cooldown", "bg-cyan-100", "text-cyan-800"],
      ["rest", "bg-gray-100", "text-gray-800"],
      ["power", "bg-yellow-100", "text-yellow-800"],
      ["heart_rate", "bg-pink-100", "text-pink-800"],
      ["cadence", "bg-indigo-100", "text-indigo-800"],
      ["pace", "bg-teal-100", "text-teal-800"],
      ["open", "bg-slate-100", "text-slate-800"],
    ])(
      "should map the %s variant to its background and text classes",
      (variant, bg, text) => {
        // Arrange

        render(<Badge variant={variant}>{variant}</Badge>);

        // Act

        const badge = screen.getByText(variant);

        // Assert

        expect(badge).toHaveClass(bg);
        expect(badge).toHaveClass(text);
      }
    );
  });

  describe("size class map", () => {
    it.each<[BadgeSize, string, string]>([
      ["sm", "px-2", "text-xs"],
      ["md", "px-2.5", "text-sm"],
      ["lg", "px-3", "text-base"],
    ])(
      "should map the %s size to its padding and text classes",
      (size, padding, text) => {
        // Arrange

        render(<Badge size={size}>{size}</Badge>);

        // Act

        const badge = screen.getByText(size);

        // Assert

        expect(badge).toHaveClass(padding);
        expect(badge).toHaveClass(text);
      }
    );
  });

  it("should render the icon alongside the label", () => {
    // Arrange

    const icon = <span data-testid="test-icon">⚡</span>;

    // Act

    render(<Badge icon={icon}>With Icon</Badge>);

    // Assert

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByText("With Icon")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    // Arrange

    render(<Badge className="custom-class">Custom</Badge>);

    // Act

    const badge = screen.getByText("Custom");

    // Assert

    expect(badge).toHaveClass("custom-class");
  });

  it("should forward ref to the underlying span", () => {
    // Arrange

    const ref = { current: null };

    // Act

    render(<Badge ref={ref}>Ref Test</Badge>);

    // Assert

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
