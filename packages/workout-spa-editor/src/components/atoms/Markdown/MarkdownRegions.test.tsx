import { getDefaultNormalizer, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Markdown } from "./Markdown";

describe("Markdown scroll regions", () => {
  it("should name the table and code scroll boxes as focusable regions", () => {
    // Arrange
    const source = "| a | b |\n|---|---|\n| 1 | 2 |\n\n```\ncode\n```";

    // Act
    render(<Markdown source={source} />);

    // Assert
    const regions = screen.getAllByRole("region");
    expect(regions.map((r) => r.getAttribute("aria-label"))).toEqual([
      "Table",
      "Code block",
    ]);
    regions.forEach((r) => expect(r).toHaveAttribute("tabIndex", "0"));
  });

  it("should keep the spaces of inline code", () => {
    // Arrange
    const source = "Run `a   b`.";

    // Act
    render(<Markdown source={source} />);

    // Assert
    const code = screen.getByText("a   b", {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
    expect(code).toHaveClass("whitespace-pre-wrap");
  });
});
