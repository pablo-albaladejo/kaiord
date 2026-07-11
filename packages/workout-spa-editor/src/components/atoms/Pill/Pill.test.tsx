import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Pill } from "./Pill";

describe("Pill", () => {
  it("should render with the neutral tone by default", () => {
    // Arrange
    render(<Pill>All</Pill>);

    // Act
    const pill = screen.getByText("All");

    // Assert
    expect(pill).toHaveClass("bg-ink-strong/5");
    expect(pill).toHaveClass("text-ink-body");
  });

  it("should render the accent tone", () => {
    // Arrange
    render(<Pill tone="accent">AI</Pill>);

    // Act
    const pill = screen.getByText("AI");

    // Assert
    expect(pill).toHaveClass("bg-accent/15");
    expect(pill).toHaveClass("text-accent");
  });

  it("should render the accentSolid tone", () => {
    // Arrange
    render(<Pill tone="accentSolid">Cycling</Pill>);

    // Act
    const pill = screen.getByText("Cycling");

    // Assert
    expect(pill).toHaveClass("bg-primary-500");
    expect(pill).toHaveClass("text-white");
  });

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
