import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findEnglish } from "./i18n-terms.mjs";

describe("findEnglish", () => {
  it("should flag English UI words and dates the audit found", () => {
    // Arrange
    const copy = "Calendario\nToday\n+ Add\nOct 5 – Oct 11\nAdd to Mon 5";

    // Act
    const hits = findEnglish(copy);

    // Assert
    assert.ok(hits.includes("Today"));
    assert.ok(hits.includes("Add"));
    assert.ok(hits.some((h) => h.startsWith("English month-day date")));
    assert.ok(hits.some((h) => h.startsWith("English weekday")));
  });

  it("should flag the week letter strip even with day numbers between", () => {
    // Arrange
    const copy = "M\n5\nT\n6\nW\n7\nT\n8";

    // Act
    const hits = findEnglish(copy);

    // Assert
    assert.ok(hits.some((h) => h.startsWith("English week letters")));
  });

  it("should not flag Spanish copy, word fragments or allowlisted names", () => {
    // Arrange
    const copy =
      "Hoy · Añadir · lun 5 · oct 5 · Guardar · Tempo · Manual · Steptoe · " +
      "Garmin Connect · OpenAI · Google Drive · Pasos totales";

    // Act
    const hits = findEnglish(copy);

    // Assert
    assert.deepEqual(hits, []);
  });

  it("should treat accented letters as part of a word", () => {
    // Arrange
    const copy = "Saveá Addí";

    // Act
    const hits = findEnglish(copy);

    // Assert
    assert.deepEqual(hits, []);
  });
});
