import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { htmlUnits } from "./claims-html.mjs";

describe("claims-html", () => {
  it("should read text nodes, text alternatives and shown metas, and drop scripts, styles and comments", () => {
    // Arrange
    const html = [
      '<title>Kaiord</title><meta name="description" content="A site.">',
      '<meta name="robots" content="index"><!-- note --><style>p{}</style>',
      '<script>var hidden = "x";</script><p>Hello &mdash; <b>world</b> ·</p>',
      '<img alt="A phone"><input placeholder="Key" aria-description="Local">',
    ].join("");

    // Act
    const units = htmlUnits(html);

    // Assert
    assert.deepEqual(units, [
      "Kaiord",
      "A site.",
      "Hello —",
      "world",
      "A phone",
      "Local",
      "Key",
    ]);
  });

  it("should keep a code example as one unit", () => {
    // Arrange
    const html = "<pre><code>const a = 1;\nconst b = 2;</code></pre>";

    // Act
    const units = htmlUnits(html);

    // Assert
    assert.deepEqual(units, ["const a = 1; const b = 2;"]);
  });
});
