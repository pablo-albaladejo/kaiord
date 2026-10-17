import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Markdown } from "./Markdown";
import { type Block, MAX_BLOCK_DEPTH, parseBlocks } from "./parse-blocks";

const DEEP = 3000;
const EXTRA = 1000;
const PAST_CAP = 3;

function depthOf(blocks: Block[]): number {
  const inner = blocks.map((b) => {
    if (b.kind === "quote") return depthOf(b.blocks);
    if (b.kind === "list") return Math.max(0, ...b.items.map(depthOf));
    return 0;
  });
  return blocks.length === 0 ? 0 : 1 + Math.max(0, ...inner);
}

describe("Markdown nesting depth", () => {
  it.each([
    ["nested quotes", ">".repeat(DEEP)],
    ["nested list markers", "- ".repeat(DEEP)],
    ["spaced dashes", `-${" -".repeat(DEEP + EXTRA)}`],
    [
      "indented nested lists",
      Array.from({ length: 200 }, (_, i) => `${"  ".repeat(i)}- x`).join("\n"),
    ],
  ])("should cap %s at the max depth and render", (_name, source) => {
    // Arrange
    const blocks = parseBlocks(source);

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(depthOf(blocks)).toBeLessThanOrEqual(MAX_BLOCK_DEPTH + 1);
    expect(container.firstElementChild?.childElementCount).toBeGreaterThan(0);
  });

  it("should keep the rest past the cap as plain text", () => {
    // Arrange
    const source = `${">".repeat(MAX_BLOCK_DEPTH + PAST_CAP)} tail`;

    // Act
    const { container } = render(<Markdown source={source} />);

    // Assert
    expect(container.querySelectorAll("blockquote")).toHaveLength(
      MAX_BLOCK_DEPTH
    );
    expect(container.textContent).toContain(">>> tail");
  });
});
