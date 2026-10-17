import { describe, expect, it } from "vitest";

import { parseBlocks } from "./parse-blocks";

describe("parseBlocks with partial (streaming) input", () => {
  it("should run an unclosed fence to the end as code", () => {
    // Arrange
    const source = "Intro\n```\nline 1\nline 2";

    // Act
    const blocks = parseBlocks(source);

    // Assert
    expect(blocks).toEqual([
      { kind: "paragraph", text: "Intro" },
      { kind: "code", text: "line 1\nline 2" },
    ]);
  });

  it("should keep a table header as a paragraph until its delimiter arrives", () => {
    // Arrange
    const partial = "| Day | Load |";

    // Act
    const before = parseBlocks(partial);
    const after = parseBlocks(`${partial}\n|---|---|`);

    // Assert
    expect(before).toEqual([{ kind: "paragraph", text: partial }]);
    expect(after[0]).toMatchObject({ kind: "table", head: ["Day", "Load"] });
  });

  it.each(["**bold", "*em", "`code", "[label](https://", "- ", "> ", "#"])(
    "should not throw on the fragment %j",
    (fragment) => {
      // Arrange
      const source = `Text ${fragment}`;

      // Act
      const parse = () => parseBlocks(fragment + "\n" + source);

      // Assert
      expect(parse).not.toThrow();
    }
  );

  it("should return no blocks for empty or blank input", () => {
    // Arrange
    const sources = ["", "\n\n  \n"];

    // Act
    const results = sources.map(parseBlocks);

    // Assert
    expect(results).toEqual([[], []]);
  });
});
