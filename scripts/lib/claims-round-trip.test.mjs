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
      'claim "w": WHOOP has no Round-trip test (the Kaiord SDK reads it but writes nothing back), so no sentence may claim a Round-trip for it',
      'claim "l": a label cannot carry a Round-trip claim',
      `claim "l": a Round-trip claim for FIT is proven by ${FIT.test} "${FIT.title}"`,
    ]);
  });

  it("should leave alone a sentence that says no Round-trip and nothing lossless", () => {
    // Arrange
    const claims = [
      { id: "b", text: "Converts FIT files in your browser." },
      { id: "c", text: "Reads .fit, .tcx and .zwo files." },
    ];

    // Act
    const problems = claims.flatMap(roundTripProblems);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should read a format in any case, by its extension or its common name", () => {
    // Arrange
    const texts = [
      "Round-trip tested for .fit and .tcx files.",
      "round trip tested: fit",
      "Round-trip tested for Zwift workouts.",
      "Round-trip tested for garmin connect workouts.",
      "Ida y vuelta probada con archivos .ZWO.",
    ];

    // Act
    const named = texts.map((text) =>
      roundTripProblems({ id: "c", text, proof: [] }).map(
        (p) => p.split("for ")[1].split(" is proven")[0]
      )
    );

    // Assert
    assert.deepEqual(named, [
      ["FIT", "TCX"],
      ["FIT"],
      ["ZWO"],
      ["GCN"],
      ["ZWO"],
    ]);
  });

  it("should read a lossless claim as a Round-trip claim", () => {
    // Arrange
    const texts = [
      "Lossless FIT conversion.",
      "Convert TCX with zero data loss.",
      "FIT keeps every value.",
      "Conversión de FIT sin pérdidas.",
    ];

    // Act
    const problems = texts.flatMap((text) =>
      roundTripProblems({ id: "c", text, proof: [] })
    );

    // Assert
    assert.equal(problems.length, texts.length);
    assert.ok(problems.every((p) => p.includes("Round-trip claim for")));
  });

  it("should refuse a format the SDK has no Round-trip test for, read-only or not written at all", () => {
    // Arrange
    const texts = [
      "WHOOP data survives a round trip.",
      "Round-trip tested for TrainingPeaks and Train2Go workouts.",
      "Round-trip tested for Tanita readings.",
      "Round-trip tested for ERG and MRC files.",
      "Round-trip tested for KRD JSON.",
      "Round-trip tested for .krd files.",
      "Round-trip tested for .gpx files.",
    ];

    // Act
    const refused = texts.map((text) =>
      roundTripProblems({ id: "c", text, proof: [] }).map(
        (p) => p.split(": ")[1].split(" has no")[0]
      )
    );

    // Assert
    assert.deepEqual(refused, [
      ["WHOOP"],
      ["TrainingPeaks", "Train2Go"],
      ["Tanita"],
      ["ERG", "MRC"],
      ["KRD JSON"],
      ["KRD JSON"],
      [".gpx"],
    ]);
  });

  it("should hold a Round-trip claim that names no format to the contract test of every format", () => {
    // Arrange
    const text = "Every format below has a Round-trip test in CI.";
    const every = ROUND_TRIP_FORMATS.map((f) => ({
      test: f.test,
      title: "should x",
    }));

    // Act
    const proven = roundTripProblems({ id: "a", text, proof: every });
    const unproven = roundTripProblems({
      id: "a",
      text,
      proof: every.slice(1),
    });

    // Assert
    assert.deepEqual(proven, []);
    assert.deepEqual(unproven, [
      `claim "a": a Round-trip claim that names no format speaks of every format, so it is proven by a test of ${FIT.test}`,
    ]);
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
