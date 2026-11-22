import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decodeEntities, normalize } from "./claims-text.mjs";

describe("claims-text", () => {
  it("should collapse every run of whitespace and trim the ends", () => {
    // Arrange
    const text = "  One\n  line,\tre-wrapped.  ";

    // Act
    const normalized = normalize(text);

    // Assert
    assert.equal(normalized, "One line, re-wrapped.");
  });

  it("should decode named, decimal and hex character references, and keep an unknown one", () => {
    // Arrange
    const text = "A &amp; B &mdash; &#8594; &#x2192; &bogus;";

    // Act
    const decoded = decodeEntities(text);

    // Assert
    assert.equal(decoded, "A & B — → → &bogus;");
  });
});
