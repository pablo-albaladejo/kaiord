import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Pill } from "./Pill";

describe("Pill", () => {
  it.each([
    {
      name: "neutral (default)",
      tone: undefined,
      label: "All",
      bg: "bg-ink-strong/5",
      text: "text-ink-body",
    },
    {
      name: "accent",
      tone: "accent",
      label: "AI",
      bg: "bg-accent/15",
      text: "text-accent",
    },
    {
      name: "accentSolid",
      tone: "accentSolid",
      label: "Cycling",
      bg: "bg-primary-500",
      text: "text-white",
    },
  ] as const)(
    "should render the $name tone with its background and text classes",
    ({ tone, label, bg, text }) => {
      // Arrange
      render(<Pill tone={tone}>{label}</Pill>);

      // Act
      const pill = screen.getByText(label);

      // Assert
      expect(pill).toHaveClass(bg);
      expect(pill).toHaveClass(text);
    }
  );

  it("should render a leading icon when provided", () => {
    // Arrange
    render(
      <Pill tone="accent" icon="plus">
        Connect
      </Pill>
    );

    // Act
    const pill = screen.getByText("Connect");

    // Assert
    expect(pill.querySelector("svg")).not.toBeNull();
  });
});
