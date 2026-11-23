import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ROUND_TRIP_FORMATS } from "./round-trip-formats.vocab.mjs";
import {
  roundTripCiProblems,
  roundTripProblems,
} from "./claims-round-trip.mjs";

const FIT = ROUND_TRIP_FORMATS.find((f) => f.format === "FIT");
const TCX = ROUND_TRIP_FORMATS.find((f) => f.format === "TCX");
const proofOf = (format) => ({ test: format.test, title: format.title });

describe("claims-round-trip", () => {
  it("should accept a Round-trip claim proven by the contract test of every format it names", () => {
    // Arrange
    const claim = {
      id: "c",
      text: "Round-trip tested: FIT and TCX keep every value.",
      proof: [proofOf(FIT), proofOf(TCX)],
    };

    // Act
    const problems = roundTripProblems(claim);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should refuse a named format whose contract test is not the proof", () => {
    // Arrange
    const claim = {
      id: "c",
      text: "Round-trip tested: FIT and TCX keep every value.",
      proof: [proofOf(FIT), { test: "other.test.ts", title: "should x" }],
    };

    // Act
    const problems = roundTripProblems(claim);

    // Assert
    assert.deepEqual(problems, [
      `claim "c": a Round-trip claim for TCX is proven by ${TCX.test} "${TCX.title}"`,
    ]);
  });

  it("should refuse a Round-trip claim for a format with no Round-trip test, and on a label", () => {
    // Arrange
    const whoop = {
      id: "w",
      text: "WHOOP data survives a round trip.",
      proof: [],
    };
    const label = { id: "l", text: "FIT round-trip", kind: "label" };

    // Act
    const problems = [...roundTripProblems(whoop), ...roundTripProblems(label)];

    // Assert
    assert.deepEqual(problems, [
      'claim "w": WHOOP has no Round-trip test, so no sentence may claim a Round-trip for it',
      'claim "l": a label cannot carry a Round-trip claim',
      `claim "l": a Round-trip claim for FIT is proven by ${FIT.test} "${FIT.title}"`,
    ]);
  });

  it("should leave alone a sentence that names no format, or that says no Round-trip", () => {
    // Arrange
    const claims = [
      { id: "a", text: "CI runs the round-trip checks." },
      { id: "b", text: "Converts FIT files in your browser." },
    ];

    // Act
    const problems = claims.flatMap(roundTripProblems);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should fail when a Round-trip format has no shard in the CI round-trip job", () => {
    // Arrange
    const ci = (list) =>
      `jobs:\n  round-trip:\n    strategy:\n      matrix:\n        package: [${list}]\n  next:\n    runs-on: x\n`;
    const all = ROUND_TRIP_FORMATS.map((f) => `"${f.package}"`).join(", ");

    // Act
    const complete = roundTripCiProblems(ci(`"core", ${all}`));
    const missing = roundTripCiProblems(ci('"core", "garmin"'));
    const absent = roundTripCiProblems("jobs:\n  lint:\n    runs-on: x\n");

    // Assert
    assert.deepEqual(complete, []);
    assert.deepEqual(
      missing.map((p) => p.split(" shard")[0]),
      ["fit", "tcx", "zwo"].map(
        (pkg) => `.github/workflows/ci.yml: the round-trip job has no "${pkg}"`
      )
    );
    assert.deepEqual(absent, [
      ".github/workflows/ci.yml: no round-trip job with a package matrix",
    ]);
  });
});
