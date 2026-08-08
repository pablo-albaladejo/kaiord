import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { BadgeSize, BadgeVariant } from "./Badge";
import { Badge } from "./Badge";

describe("Badge", () => {
  describe("variant class map", () => {
    // Every variant renders the same neutral chip on purpose: thirteen hues
    // for intensity and target type competed with the five that mean training
    // zones, and the chip's own word was always the signal. This pins the
    // invariant so a hue cannot creep back in one variant at a time.
    const VARIANTS: BadgeVariant[] = [
      "default",
      "warmup",
      "active",
      "cooldown",
      "rest",
      "recovery",
      "interval",
      "other",
      "power",
      "heart_rate",
      "cadence",
      "pace",
      "stroke_type",
      "open",
    ];

    it.each<[BadgeVariant]>(VARIANTS.map((v) => [v]))(
      "should render the %s variant as the neutral chip",
      (variant) => {
        // Arrange

        render(<Badge variant={variant}>{variant}</Badge>);

        // Act

        const badge = screen.getByText(variant);

        // Assert

        expect(badge).toHaveClass("bg-surface-elevated");
        expect(badge).toHaveClass("text-ink-body");
        expect(badge.className).not.toMatch(
          /-(blue|red|cyan|green|orange|purple|yellow|pink|indigo|teal|sky|slate|gray)-[0-9]/
        );
      }
    );

    it("should give every variant the exact same chip classes", () => {
      // Arrange
      const rendered = VARIANTS.map((variant) => {
        const { container } = render(<Badge variant={variant}>x</Badge>);
        return container.firstElementChild?.className;
      });

      // Act

      const distinct = new Set(rendered);

      // Assert

      expect(distinct.size).toBe(1);
    });
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
