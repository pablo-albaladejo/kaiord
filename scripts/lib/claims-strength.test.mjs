import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { claimProblems, MIN_PIN, proofStrength } from "./claims-strength.mjs";

const OWN = new Set(["surface.md"]);

describe("claims-strength", () => {
  it(`should rank a test above a pin of ${MIN_PIN}+ characters outside the surfaces, and find nothing else strong`, () => {
    // Arrange
    const claims = [
      { proof: [{ test: "a.test.js", title: "should x" }] },
      { proof: [{ file: "code.js", contains: "export const pinnedLine" }] },
      { proof: [{ file: "code.js", contains: "short" }] },
      {
        proof: [
          { file: "surface.md", contains: "a long line on the surface itself" },
        ],
      },
      { proof: [{ file: "code.js" }, { endpoint: "https://x.test/" }] },
    ];

    // Act
    const strength = claims.map((c) => proofStrength(c, OWN));

    // Assert
    assert.deepEqual(strength, ["test", "pinned", null, null, null]);
  });

  it("should need no proof for a label and refuse a fact with none or only weak ones", () => {
    // Arrange
    const read = (path) => (path === "code.js" ? "x" : null);
    const options = { ownFiles: OWN, today: Date.now() };

    // Act
    const label = claimProblems(
      { id: "l", text: "L", kind: "label" },
      read,
      options
    );
    const none = claimProblems(
      { id: "n", text: "N", proof: [] },
      read,
      options
    );
    const weak = claimProblems(
      { id: "w", text: "W", proof: [{ file: "code.js" }] },
      read,
      options
    );

    // Assert
    assert.deepEqual(label, []);
    assert.deepEqual(none, ['claim "n": has no proof']);
    assert.match(weak[0], /^claim "w": is proven only by a file existing/);
  });
});
