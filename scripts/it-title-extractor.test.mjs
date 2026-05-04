import { test } from "node:test";
import assert from "node:assert/strict";

import { findItTitles } from "./it-title-extractor.mjs";

test("findItTitles: plain it() call", () => {
  // Arrange
  const source = `it("renders the header", () => {});`;

  // Act
  const titles = [...findItTitles(source)].map((t) => t.title);

  // Assert
  assert.deepEqual(titles, ["renders the header"]);
});

test("findItTitles: it.skip / it.only / it.todo / it.fails", () => {
  // Arrange
  const source = `
    it.skip("returns a", () => {});
    it.only("rejects b", () => {});
    it.todo("handles c");
    it.fails("throws d", () => {});
  `;

  // Act
  const titles = [...findItTitles(source)].map((t) => t.title);

  // Assert
  assert.deepEqual(
    titles.sort(),
    ["handles c", "rejects b", "returns a", "throws d"].sort()
  );
});

test("findItTitles: it.each(array)(title) does NOT capture array contents as title", () => {
  // Arrange — the array contains string literals that a naive regex
  // would falsely capture as the title.
  const source = `it.each([
    [0, "pending"],
    [1, "completed"],
  ])("should map status %s → %s", (code, expected) => {});`;

  // Act
  const titles = [...findItTitles(source)].map((t) => t.title);

  // Assert — the actual outer title, NOT "pending" or "completed"
  assert.deepEqual(titles, ["should map status %s → %s"]);
});

test("findItTitles: it.each(simple-array)(title)", () => {
  // Arrange
  const source = `it.each([["weekStart"], ["activityId"]])("should reject empty %s", v => {});`;

  // Act
  const titles = [...findItTitles(source)].map((t) => t.title);

  // Assert — outer title only, not the inner array's strings
  assert.deepEqual(titles, ["should reject empty %s"]);
});

test("findItTitles: mix of plain and it.each in same file", () => {
  // Arrange
  const source = `
    it("plain title", () => {});
    it.each([1, 2, 3])("each title %s", v => {});
    it("another plain", () => {});
  `;

  // Act
  const titles = [...findItTitles(source)].map((t) => t.title);

  // Assert
  assert.deepEqual(titles.sort(), [
    "another plain",
    "each title %s",
    "plain title",
  ]);
});

test("findItTitles: titleStart points at the first character inside the opening quote", () => {
  // Arrange
  const source = `xx it("hello", () => {})`;

  // Act
  const [first] = [...findItTitles(source)];

  // Assert
  assert.equal(source[first.titleStart], "h");
});

test("findItTitles: deduplicates overlapping matches", () => {
  // Arrange — `it.each(arr)(title)` would in principle match BOTH
  // the each-regex (correct) and the plain-regex (potentially on
  // a quote inside the array). The dedupe by titleStart ensures only
  // one entry survives.
  const source = `it.each([[1, "p"]])("should X", v => {});`;

  // Act
  const titles = [...findItTitles(source)].map((t) => t.title);

  // Assert
  assert.deepEqual(titles, ["should X"]);
});

test("findItTitles: ignores non-it identifiers", () => {
  // Arrange — `submit("X")` shouldn't be captured because of \bit\b
  const source = `submit("form data", () => {});`;

  // Act
  const titles = [...findItTitles(source)];

  // Assert
  assert.deepEqual(titles, []);
});
