import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { readSurfaces, registerProblems } from "./claims-register.mjs";

const read = (files) => (path) => files[path] ?? null;

describe("claims-register", () => {
  it("should return the units of each surface without changing the surfaces it was given", () => {
    // Arrange
    const surfaces = Object.freeze([Object.freeze({ file: "a.md" })]);

    // Act
    const { found, problems } = readSurfaces(
      surfaces,
      read({ "a.md": "One.\n" })
    );

    // Assert
    assert.deepEqual(found, [{ file: "a.md", units: ["One."] }]);
    assert.deepEqual(problems, []);
  });

  it("should compare how often a text shows with the entries and counts the register holds", () => {
    // Arrange
    const files = { "a.md": "Hi\n\nHi\n\nHi\n" };
    const data = {
      surfaces: [{ file: "a.md" }],
      claims: [{ id: "hi", text: "Hi", kind: "label", count: 2 }],
    };

    // Act
    const { problems, strength } = registerProblems(
      "claims/r.json",
      data,
      read(files),
      Date.now()
    );

    // Assert
    assert.deepEqual(problems, [
      'claims/r.json: "Hi" appears 3 time(s) on its surfaces but the register accounts for 2; add an entry for each new occurrence (or a count when it is the same claim)',
    ]);
    assert.deepEqual(strength, ["label"]);
  });
});
