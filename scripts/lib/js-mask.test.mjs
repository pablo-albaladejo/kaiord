import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { maskSource } from "./js-mask.mjs";

describe("js-mask", () => {
  it("should blank comments, strings, templates and regex bodies, keeping length and lines", () => {
    // Arrange
    const src = [
      'const a = "it(\\"x\\")"; // it("y")',
      "/* it('z') */ const r = /it\\(/;",
      'const t = `a ${f("b")} it(`;',
      "render(<div>hi</div>);",
    ].join("\n");

    // Act
    const { code } = maskSource(src);

    // Assert
    assert.equal(code.length, src.length);
    assert.equal(code.split("\n").length, 4);
    assert.doesNotMatch(code, /it\(/);
    assert.match(code, /render\(<div>hi<\/div>\);/);
    assert.match(code, /f\(" "\)/);
  });

  it("should list each literal with its offset and raw body", () => {
    // Arrange
    const src = "it('should one', () => {});";

    // Act
    const { literals } = maskSource(src);

    // Assert
    assert.deepEqual(
      literals.map(({ start, body, quote }) => ({ start, body, quote })),
      [{ start: 3, body: "should one", quote: "'" }]
    );
  });
});
