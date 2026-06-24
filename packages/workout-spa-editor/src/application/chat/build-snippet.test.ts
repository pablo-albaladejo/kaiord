import { describe, expect, it } from "vitest";

import { buildSnippet, findMatchRanges } from "./build-snippet";

// Wider than the ±30 snippet radius, so both sides truncate.
const PAD = 40;

describe("findMatchRanges", () => {
  it("should locate each token span in the original accented text", () => {
    // Arrange
    const text = "cerca del úmbral funcional";

    // Act
    const ranges = findMatchRanges(text, ["umbral"]);

    // Assert
    expect(ranges).toHaveLength(1);
    const [start, end] = ranges[0];
    expect(text.slice(start, end)).toBe("úmbral");
  });

  it("should return ranges sorted by start", () => {
    // Arrange
    const text = "vo2 al umbral";

    // Act
    const ranges = findMatchRanges(text, ["umbral", "vo2"]);

    // Assert
    expect(ranges.map(([start]) => start)).toEqual([
      text.indexOf("vo2"),
      text.indexOf("umbral"),
    ]);
  });
});

describe("buildSnippet", () => {
  it("should window context and add ellipses on both truncated sides", () => {
    // Arrange
    const text = `${"a".repeat(PAD)} umbral ${"b".repeat(PAD)}`;
    const ranges = findMatchRanges(text, ["umbral"]);

    // Act
    const snippet = buildSnippet(text, ranges);

    // Assert
    expect(snippet.text.startsWith("…")).toBe(true);
    expect(snippet.text.endsWith("…")).toBe(true);
    expect(snippet.text.includes("umbral")).toBe(true);
  });

  it("should not add ellipsis on a side that is not truncated", () => {
    // Arrange
    const text = `umbral ${"b".repeat(PAD)}`;
    const ranges = findMatchRanges(text, ["umbral"]);

    // Act
    const snippet = buildSnippet(text, ranges);

    // Assert
    expect(snippet.text.startsWith("…")).toBe(false);
    expect(snippet.text.endsWith("…")).toBe(true);
  });

  it("should rebase highlight ranges onto the snippet text", () => {
    // Arrange
    const text = `${"a".repeat(PAD)} umbral tail`;
    const ranges = findMatchRanges(text, ["umbral"]);

    // Act
    const snippet = buildSnippet(text, ranges);

    // Assert
    const [start, end] = snippet.ranges[0];
    expect(snippet.text.slice(start, end)).toBe("umbral");
  });

  it("should return an empty snippet when there are no ranges", () => {
    // Arrange
    const text = "nothing matches here";

    // Act
    const snippet = buildSnippet(text, []);

    // Assert
    expect(snippet).toEqual({ text: "", ranges: [] });
  });
});
