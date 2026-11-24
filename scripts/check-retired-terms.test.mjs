import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  checkAthleteTerms,
  checkRetiredTerms,
  retiredTermProblems,
} from "./check-retired-terms.mjs";
import { loadRegisters, repoReader } from "./check-claims.mjs";
import {
  ATHLETE_ALLOWED,
  ATHLETE_FILES,
  ATHLETE_TERMS,
  FILES,
  TERMS,
} from "./retired-terms.vocab.mjs";

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

describe("check-retired-terms, athlete-facing words", () => {
  const athlete = { terms: ATHLETE_TERMS, allowed: ATHLETE_ALLOWED };

  it("should fail on bridge and on the Kaiord extension, in English and in Spanish", () => {
    // Arrange
    const texts = [
      "Install the Garmin Bridge.",
      "Kaiord Garmin Bridge",
      "The bridges read your data.",
      "Connect through the Kaiord extension.",
      "Install a Kaiord extension first.",
      "Se conectan con la extensión de Kaiord.",
      "Instala la extensión Kaiord.",
    ];

    // Act
    const problems = texts.map((text) =>
      retiredTermProblems("x.json", text, athlete)
    );

    // Assert
    assert.ok(
      problems.every((p) => p.length === 1),
      JSON.stringify(problems)
    );
  });

  it("should let the athlete read Kaiord for a Platform and extension", () => {
    // Arrange
    const texts = [
      "Install Kaiord for Garmin in this browser.",
      "Each connection holds its own extension and permissions.",
      "Instala Kaiord for Train2Go: la extensión lee tu plan.",
    ];

    // Act
    const problems = texts.flatMap((text) =>
      retiredTermProblems("x.json", text, athlete)
    );

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should fail on Capability and Capacidad in athlete-facing text, in English and in Spanish", () => {
    // Arrange
    const texts = [
      "Capabilities",
      "Turn on a Capability in Settings.",
      "Capacidades",
      "Activa una capacidad en Ajustes.",
    ];

    // Act
    const problems = texts.map((text) =>
      retiredTermProblems("x.json", text, athlete)
    );

    // Assert
    assert.ok(
      problems.every((p) => p.length === 1 && p[0].includes("Feature")),
      JSON.stringify(problems)
    );
  });

  it("should let the athlete read Features and Funciones, and a declared token or a physiological capacity", () => {
    // Arrange
    const texts = [
      "Features",
      "Funciones",
      "Only the `read:body` capability is declared.",
      "Capacidad aeróbica",
    ];

    // Act
    const problems = texts.flatMap((text) =>
      retiredTermProblems("x.json", text, athlete)
    );

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should pass an npm package name and a store address that must stay", () => {
    // Arrange
    const text =
      "`@kaiord/garmin-bridge` is on https://chromewebstore.google.com/detail/kaiord-garmin-bridge/innelncjhkdokailkinkchppgekennoe";

    // Act
    const problems = retiredTermProblems("x.md", text, athlete);

    // Assert
    assert.deepEqual(problems, []);
  });

  it("should read the App dictionaries, the extensions' texts, the registered surfaces and the listed files", () => {
    // Arrange
    const registers = [
      {
        name: "claims/a.json",
        data: { surfaces: [{ file: "a.md" }], claims: [] },
      },
    ];
    const files = {
      "a.md": "The Kaiord extension reads Garmin.\n",
      "b.md": "Install the Kaiord Tanita Bridge.",
    };
    const appTexts = [
      { where: "es/settings.json#info", text: "la extensión de Kaiord" },
      { where: "en/connections.json#ok", text: "Kaiord for Garmin" },
    ];

    // Act
    const problems = checkAthleteTerms({
      registers,
      read: reader(files),
      files: ["b.md", "gone.md"],
      athleteTexts: appTexts,
      allowed: [],
    });

    // Assert
    assert.deepEqual(
      problems.map((p) => p.split(":")[0]),
      ["a.md", "b.md", "gone.md", "es/settings.json#info"]
    );
  });

  it("should fail on an allowed phrase that no athlete text holds any more", () => {
    // Arrange
    const allowed = [{ phrase: "@kaiord/foo-bridge", why: "a package name" }];

    // Act
    const problems = checkAthleteTerms({
      registers: [],
      read: reader({}),
      files: [],
      athleteTexts: [{ where: "x", text: "Kaiord for Garmin" }],
      allowed,
    });

    // Assert
    assert.deepEqual(problems, [
      'ALLOWED phrase "@kaiord/foo-bridge" is on no athlete-facing text: remove it from retired-terms.vocab.mjs',
    ]);
  });

  it("should pass on the athlete-facing texts the repo ships", () => {
    // Arrange
    const registers = loadRegisters();

    // Act
    const problems = checkAthleteTerms({
      registers,
      read: repoReader,
      files: ATHLETE_FILES,
    });

    // Assert
    assert.deepEqual(problems, []);
  });
});
