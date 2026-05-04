import { test } from "node:test";
import assert from "node:assert/strict";

import {
  compareSources,
  getBaseRef,
  scanTokens,
} from "./check-aaa-migration-no-logic-edits.mjs";

test("scanTokens returns same tokens for two identical sources", () => {
  // Arrange
  const source = `it("should X", () => { expect(1).toBe(1); });`;

  // Act
  const a = scanTokens(source);
  const b = scanTokens(source);

  // Assert
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) {
    assert.equal(a[i].kind, b[i].kind);
    assert.equal(a[i].text, b[i].text);
  }
});

test("compareSources returns equal=true for identical sources", () => {
  // Arrange
  const source = `it("should X", () => { expect(1).toBe(1); });`;

  // Act
  const result = compareSources(source, source);

  // Assert
  assert.equal(result.equal, true);
});

test("compareSources returns equal=true when only added comments differ", () => {
  // Arrange
  const base = `it("should X", () => {
  const x = 1;
  expect(x).toBe(1);
});`;
  const head = `it("should X", () => {
  // Arrange
  const x = 1;

  // Act
  // Assert
  expect(x).toBe(1);
});`;

  // Act
  const result = compareSources(base, head);

  // Assert — comment additions and whitespace are trivia
  assert.equal(result.equal, true);
});

test("compareSources fails when a string literal changes", () => {
  // Arrange
  const base = `it("should X", () => { return "hello"; });`;
  const head = `it("should X", () => { return "world"; });`;

  // Act
  const result = compareSources(base, head);

  // Assert
  assert.equal(result.equal, false);
  assert.match(result.reason, /token #\d+ differs/);
});

test("compareSources fails when an extra expect() call is added", () => {
  // Arrange
  const base = `it("should X", () => { expect(1).toBe(1); });`;
  const head = `it("should X", () => { expect(1).toBe(1); expect(2).toBe(2); });`;

  // Act
  const result = compareSources(base, head);

  // Assert
  assert.equal(result.equal, false);
  assert.match(result.reason, /token count differs/);
});

test("compareSources fails when statements are reordered", () => {
  // Arrange
  const base = `it("should X", () => { const a = 1; const b = 2; });`;
  const head = `it("should X", () => { const b = 2; const a = 1; });`;

  // Act
  const result = compareSources(base, head);

  // Assert — same token count but identifiers are swapped
  assert.equal(result.equal, false);
});

test("compareSources fails when a number literal changes", () => {
  // Arrange
  const base = `it("should X", () => { expect(timeout).toBe(100); });`;
  const head = `it("should X", () => { expect(timeout).toBe(200); });`;

  // Act
  const result = compareSources(base, head);

  // Assert
  assert.equal(result.equal, false);
  assert.match(result.reason, /token #\d+ differs/);
  assert.match(result.reason, /"100"/);
  assert.match(result.reason, /"200"/);
});

test("compareSources reports the line of the first divergent token", () => {
  // Arrange
  const base = ["const x = 1;", "const y = 2;", "const z = 3;"].join("\n");
  const head = ["const x = 1;", "const y = 99;", "const z = 3;"].join("\n");

  // Act
  const result = compareSources(base, head);

  // Assert — first divergent token is `99` on line 2
  assert.equal(result.equal, false);
  assert.equal(result.line, 2);
});

test("getBaseRef prefers --base flag over env var and default", () => {
  // Arrange
  const argv = ["node", "script.mjs", "--base=HEAD~1"];
  const env = { MIGRATION_BASE: "origin/dev" };

  // Act
  const base = getBaseRef(argv, env);

  // Assert
  assert.equal(base, "HEAD~1");
});

test("getBaseRef falls back to MIGRATION_BASE env var", () => {
  // Arrange
  const argv = ["node", "script.mjs"];
  const env = { MIGRATION_BASE: "origin/dev" };

  // Act
  const base = getBaseRef(argv, env);

  // Assert
  assert.equal(base, "origin/dev");
});

test("getBaseRef defaults to origin/main when neither flag nor env set", () => {
  // Arrange
  const argv = ["node", "script.mjs"];
  const env = {};

  // Act
  const base = getBaseRef(argv, env);

  // Assert
  assert.equal(base, "origin/main");
});
