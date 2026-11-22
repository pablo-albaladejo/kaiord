import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { markdownUnits, sectionLines, surfaceUnits } from "./claims-units.mjs";

describe("claims-units", () => {
  it("should cut markdown into headings, list items, table rows and paragraphs", () => {
    // Arrange
    const lines = [
      "# Title",
      "",
      "A paragraph",
      "wrapped.",
      "",
      "- An item",
      "  continued",
      "| a | b |",
      "| --- | --- |",
    ];

    // Act
    const units = markdownUnits(lines);

    // Assert
    assert.deepEqual(units, [
      "Title",
      "A paragraph wrapped.",
      "An item continued",
      "| a | b |",
    ]);
  });

  it("should take a section to the next heading of its level and fail on a missing one", () => {
    // Arrange
    const lines = ["## A", "One", "### Sub", "Two", "## B", "Three"];

    // Act
    const section = sectionLines(lines, "A");
    const missing = surfaceUnits(
      { file: "x.md", sections: ["C"] },
      lines.join("\n")
    );

    // Assert
    assert.deepEqual(section, ["One", "### Sub", "Two"]);
    assert.deepEqual(missing, { error: 'x.md: section "C" is missing' });
  });

  it("should read an HTML page with its JSON-LD, and drop front matter and comments from markdown", () => {
    // Arrange
    const html =
      '<p>Shown</p><script type="application/ld+json">{"name":"Named"}</script>';
    const md = "---\ntitle: x\n---\n<!-- hidden -->\nShown.\n";

    // Act
    const units = [
      surfaceUnits({ file: "a.html" }, html),
      surfaceUnits({ file: "a.md" }, md),
    ];

    // Assert
    assert.deepEqual(units, [
      { units: ["Shown", "Named"] },
      { units: ["Shown."] },
    ]);
  });
});
