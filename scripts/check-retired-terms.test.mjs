import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  checkRetiredTerms,
  retiredTermProblems,
} from "./check-retired-terms.mjs";
import { loadRegisters, repoReader } from "./check-claims.mjs";
import { FILES, TERMS } from "./retired-terms.vocab.mjs";

const reader = (files) => (path) => files[path] ?? null;

describe("check-retired-terms", () => {
  it("should fail on every retired or withdrawn term, in English and in Spanish", () => {
    // Arrange
    const texts = [
      "An open-source fitness framework.",
      "The training cockpit.",
      "Lossless conversion.",
      "Conversión sin pérdidas.",
      "Zero data loss.",
      "KRD is round-trip safe.",
      "An open standard for workouts.",
      "Un estándar abierto.",
      "KRD, the interchange format.",
      "KRD, el formato de intercambio.",
      "The Kaiord platform for athletes.",
      "Kaiord is an open fitness platform.",
      "La plataforma de Kaiord.",
    ];

    // Act
    const problems = texts.map((text) => retiredTermProblems("x.md", text));

    // Assert
    assert.ok(
      problems.every((p) => p.length === 1),
      JSON.stringify(problems)
    );
  });

  it("should let a Platform such as Garmin be called a platform", () => {
    // Arrange
    const text =
      "Kaiord reaches each platform you connect. Garmin is the platform that decides.";

    // Act
    const problems = retiredTermProblems("x.md", text);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should pass an exact allowed phrase and still fail the term elsewhere", () => {
    // Arrange
    const allowed = [
      { phrase: "the Vitest framework", reason: "a third-party name" },
    ];
    const text = "Tests run on the Vitest framework. Kaiord is a framework.";

    // Act
    const problems = retiredTermProblems("x.md", text, {
      terms: TERMS,
      allowed,
    });

    // Assert
    assert.deepEqual(problems, [
      'x.md: "framework" (framework, retired by GLOSSARY.md: Kaiord is the Kaiord SDK and the Kaiord App)',
    ]);
  });

  it("should read every registered surface and every listed file, and fail on a listed file that is gone", () => {
    // Arrange
    const registers = [
      {
        name: "claims/a.json",
        data: { surfaces: [{ file: "a.md" }], claims: [] },
      },
    ];
    const files = {
      "a.md": "A lossless format.\n",
      "b.ts": "'Kaiord is a fitness data framework.'",
    };

    // Act
    const problems = checkRetiredTerms({
      registers,
      read: reader(files),
      files: ["b.ts", "gone.md"],
    });

    // Assert
    assert.deepEqual(
      problems.map((p) => p.split(":")[0]),
      ["a.md", "b.ts", "gone.md"]
    );
  });

  it("should pass on the surfaces and files the repo ships", () => {
    // Arrange
    const registers = loadRegisters();

    // Act
    const problems = checkRetiredTerms({
      registers,
      read: repoReader,
      files: FILES,
    });

    // Assert
    assert.deepEqual(problems, []);
  });
});
