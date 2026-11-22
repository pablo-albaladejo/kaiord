import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { duplicateProblems } from "./claims-owners.mjs";

describe("claims-owners", () => {
  it("should let two register files own different sections of one file and refuse a taken one", () => {
    // Arrange
    const owners = { surfaces: new Map(), ids: new Map() };
    const a = {
      surfaces: [{ file: "p.md", sections: ["A"] }],
      claims: [{ id: "x" }],
    };
    const b = {
      surfaces: [{ file: "p.md", sections: ["B", "A"] }],
      claims: [{ id: "x" }],
    };

    // Act
    const problems = [
      duplicateProblems("claims/a.json", a, owners),
      duplicateProblems("claims/b.json", b, owners),
    ];

    // Assert
    assert.deepEqual(problems, [
      [],
      [
        'claims/b.json: surface p.md (section "A") is already registered in claims/a.json',
        'claims/b.json: claim id "x" is already used in claims/a.json',
      ],
    ]);
  });

  it("should refuse a surface field it does not know", () => {
    // Arrange
    const owners = { surfaces: new Map(), ids: new Map() };
    const data = { surfaces: [{ file: "p.md", section: ["A"] }], claims: [] };

    // Act
    const problems = duplicateProblems("claims/a.json", data, owners);

    // Assert
    assert.deepEqual(problems, [
      "claims/a.json: surface p.md has unknown field(s) section",
    ]);
  });
});
