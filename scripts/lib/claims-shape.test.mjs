import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { shapeProblems, STALE_DAYS, unknownFields } from "./claims-shape.mjs";

const TODAY = Date.parse("2026-11-22T00:00:00Z");

describe("claims-shape", () => {
  it("should allow only each kind's fields and a count of two or more", () => {
    // Arrange
    const claims = [
      { id: "a", text: "A", kind: "label" },
      { id: "b", text: "B", kind: "label", proof: [] },
      { id: "c", text: "C", proof: [], count: 1 },
      { id: "d", text: "D", kind: "fact" },
    ];

    // Act
    const problems = claims.map((c) => shapeProblems(c, TODAY));

    // Assert
    assert.deepEqual(problems, [
      [],
      ['claim "b" has unknown field(s) proof'],
      ['claim "c": count is a whole number of 2 or more'],
      ['claim "d": kind "fact" is none of label, external'],
    ]);
  });

  it(`should hold an external claim to an https url and a reading of ${STALE_DAYS} days or less`, () => {
    // Arrange
    const fresh = {
      id: "f",
      text: "F",
      kind: "external",
      url: "https://x.test/",
      read_on: "2026-05-26",
    };
    const stale = { ...fresh, id: "s", read_on: "2026-05-25" };

    // Act
    const problems = [shapeProblems(fresh, TODAY), shapeProblems(stale, TODAY)];

    // Assert
    assert.deepEqual(problems[0], []);
    assert.match(problems[1][0], /read on 2026-05-25, more than 180 days ago/);
  });

  it("should name the unknown fields of an object", () => {
    // Arrange
    const object = { a: 1, b: 2 };

    // Act
    const problems = unknownFields("thing", object, ["a"]);

    // Assert
    assert.deepEqual(problems, ["thing has unknown field(s) b"]);
  });
});
