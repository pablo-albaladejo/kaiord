import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  extractFirstWords,
  formatHistogram,
  measureHistogram,
} from "./measure-it-titles-histogram.mjs";

function makeTempTree(setup) {
  const root = mkdtempSync(join(tmpdir(), "histogram-"));
  setup(root);
  return root;
}

test("extracts first word from plain it() call", () => {
  // Arrange
  const source = `it("renders the calendar", () => {});`;

  // Act
  const words = extractFirstWords(source);

  // Assert
  assert.deepEqual(words, ["renders"]);
});

test("extracts first word from it.skip / it.only / it.todo / it.fails", () => {
  // Arrange
  const source = `
    it.skip("returns null when input is empty", () => {});
    it.only("rejects malformed input", () => {});
    it.todo("handles edge case");
    it.fails("throws on invalid state", () => {});
  `;

  // Act
  const words = extractFirstWords(source);

  // Assert
  assert.deepEqual(words, ["returns", "rejects", "handles", "throws"]);
});

test("extracts first word from it.each chained call", () => {
  // Arrange
  const source = `it.each([1, 2, 3])("computes square for %s", (v) => {});`;

  // Act
  const words = extractFirstWords(source);

  // Assert
  assert.deepEqual(words, ["computes"]);
});

test("ignores non-it identifiers ending in 'it'", () => {
  // Arrange
  const source = `submit("form data", () => {}); commit("changes", () => {});`;

  // Act
  const words = extractFirstWords(source);

  // Assert — \bit\b word boundary prevents picking up the "it" suffix
  assert.deepEqual(words, []);
});

test("supports template-literal titles", () => {
  // Arrange
  const source = "it(`should render component`, () => {});";

  // Act
  const words = extractFirstWords(source);

  // Assert
  assert.deepEqual(words, ["should"]);
});

test("counts repeated first-words across multiple it() calls", () => {
  // Arrange
  const file = `
    it("renders the header", () => {});
    it("renders the body", () => {});
    it("returns null on empty", () => {});
  `;

  // Act
  const root = makeTempTree((dir) => {
    mkdirSync(join(dir, "packages", "x", "src"), { recursive: true });
    writeFileSync(join(dir, "packages", "x", "src", "x.test.ts"), file);
  });
  try {
    const counts = measureHistogram([
      join(root, "packages", "x", "src", "x.test.ts"),
    ]);

    // Assert
    assert.equal(counts.get("renders"), 2);
    assert.equal(counts.get("returns"), 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("formatHistogram sorts by descending count then ascending word", () => {
  // Arrange
  const counts = new Map([
    ["renders", 5],
    ["returns", 5],
    ["should", 200],
    ["throws", 1],
  ]);

  // Act
  const formatted = formatHistogram(counts);

  // Assert — descending count; ties broken alphabetically
  assert.equal(formatted, "200 should\n5 renders\n5 returns\n1 throws");
});

test("ignores titles starting with non-letter characters", () => {
  // Arrange
  const source = `
    it("123 numeric prefix", () => {});
    it("@special prefix", () => {});
  `;

  // Act
  const words = extractFirstWords(source);

  // Assert — regex requires [A-Za-z] for first character
  assert.deepEqual(words, []);
});
