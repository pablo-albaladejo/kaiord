import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AttentionMark } from "./AttentionMark";

describe("AttentionMark", () => {
  it("should render inked from the text role and carry no palette hue", () => {
    // Arrange
    render(<AttentionMark data-testid="mark" />);

    // Act
    const mark = screen.getByTestId("mark");

    // Assert
    expect(mark.className).toContain("text-ink-strong");
    expect(mark.className).not.toMatch(/amber|emerald|yellow|red-\d/);
  });

  it("should be decorative, so the sentence beside it carries the meaning", () => {
    // Arrange
    render(<AttentionMark data-testid="mark" />);

    // Act
    const mark = screen.getByTestId("mark");

    // Assert
    expect(mark).toHaveAttribute("aria-hidden", "true");
  });

  it.each([
    { name: "default", size: undefined, expected: "w-4" },
    { name: "xs", size: "xs", expected: "w-3" },
  ] as const)(
    "should render the $name size as $expected",
    ({ size, expected }) => {
      // Arrange
      render(<AttentionMark size={size} data-testid="mark" />);

      // Act
      const icon = screen.getByTestId("mark").firstElementChild;

      // Assert
      expect(icon?.className).toContain(expected);
    }
  );

  it("should keep the caller's className alongside the role class", () => {
    // Arrange
    render(<AttentionMark className="mt-0.5" data-testid="mark" />);

    // Act
    const mark = screen.getByTestId("mark");

    // Assert
    expect(mark.className).toContain("mt-0.5");
    expect(mark.className).toContain("text-ink-strong");
  });
});
