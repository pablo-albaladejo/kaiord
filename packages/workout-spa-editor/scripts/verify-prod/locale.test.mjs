import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { englishLeaks, englishPieces, localeText } from "./locale.mjs";

describe("localeText", () => {
  it("should read a nested key from the SPA's locale files", () => {
    // Arrange
    const key = "body.sex";

    // Act
    const es = localeText("es", "athlete", key);
    const en = localeText("en", "athlete", key);

    // Assert
    assert.equal(es, "Sexo");
    assert.equal(en, "Sex");
  });

  it("should throw on a key the locale file lacks", () => {
    // Arrange
    const key = "body.noSuchKey";

    // Act
    const read = () => localeText("es", "athlete", key);

    // Assert
    assert.throws(read, /athlete:body\.noSuchKey/);
  });
});

describe("englishPieces", () => {
  it("should list the English strings under a key that Spanish words differently", () => {
    // Arrange
    const prefix = "goalSetup.types";

    // Act
    const pieces = englishPieces("nutrition", prefix);

    // Assert
    assert.deepEqual(pieces, ["Fat loss", "Muscle gain", "Maintain"]);
  });

  it("should split interpolations and keep only the static English text", () => {
    // Arrange
    const prefix = "goalSetup.deficit";

    // Act
    const pieces = englishPieces("nutrition", prefix);

    // Assert
    assert.deepEqual(pieces, ["kcal / day deficit"]);
  });
});

describe("englishLeaks", () => {
  it("should report an English piece that appears as whole words", () => {
    // Arrange
    const copy = "Fijar objetivo de energía\nGoal type\nPerder grasa";

    // Act
    const leaks = englishLeaks(copy, ["Goal type", "Fat loss"]);

    // Assert
    assert.deepEqual(leaks, ["Goal type"]);
  });

  it("should not report an English word that is only the start of a Spanish one", () => {
    // Arrange
    const copy = "Sexo\nEditar perfil";

    // Act
    const leaks = englishLeaks(copy, ["Sex", "Edit"]);

    // Assert
    assert.deepEqual(leaks, []);
  });
});

describe("the heart-rate unit", () => {
  it("should be ppm in Spanish and bpm in English", () => {
    // Arrange
    const key = "units.hr";

    // Act
    const es = localeText("es", "common", key);
    const en = localeText("en", "common", key);

    // Assert
    assert.equal(es, "ppm");
    assert.equal(en, "bpm");
  });
});
