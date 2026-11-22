import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { proofProblems } from "./claims-proof.mjs";

const read = (files) => (path) => files[path] ?? null;

describe("claims-proof", () => {
  it("should hold a file pin, a running test and an https endpoint", () => {
    // Arrange
    const files = {
      "a.js": "const pinned = 1;",
      "a.test.js": 'it("should run", () => {});',
      "site.html": "",
    };
    const proofs = [
      { file: "a.js", contains: "const pinned" },
      { test: "a.test.js", title: "should run" },
      { endpoint: "https://kaiord.com/", servedBy: "site.html" },
    ];

    // Act
    const problems = proofs.flatMap((p) => proofProblems(p, read(files)));

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should refuse a broken pin, an http endpoint, a kaiord.com url with no servedBy and an unknown field", () => {
    // Arrange
    const files = { "a.js": "const b = 2;" };
    const proofs = [
      { file: "a.js", contains: "const a" },
      { endpoint: "http://x.test/" },
      { endpoint: "https://kaiord.com/x" },
      { file: "a.js", contain: "x" },
    ];

    // Act
    const problems = proofs.flatMap((p) => proofProblems(p, read(files)));

    // Assert
    assert.deepEqual(problems, [
      'a.js no longer contains "const a"',
      "endpoint http://x.test/ is not https",
      "endpoint https://kaiord.com/x names no servedBy file",
      'proof {"file":"a.js","contain":"x"} has unknown field(s) contain',
    ]);
  });
});
