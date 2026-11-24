import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { statementProblems } from "./claims-statement.mjs";

const OWNER = "the repository's owner";

describe("claims-statement", () => {
  it("should hold exact words by a role on a date", () => {
    // Arrange
    const proof = { "author-statement": "words", by: OWNER, on: "2026-11-24" };

    // Act
    const problems = statementProblems(proof);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should report a statement that is not words instead of throwing", () => {
    // Arrange
    const proofs = [42, null, ["words"], { text: "words" }].map((words) => ({
      "author-statement": words,
      by: OWNER,
      on: "2026-11-24",
    }));

    // Act
    const problems = proofs.map((p) => statementProblems(p));

    // Assert
    assert.deepEqual(
      problems.map((p) => p.length),
      [1, 1, 1, 1]
    );
    for (const [p] of problems) assert.match(p, /is not words/);
  });
});
