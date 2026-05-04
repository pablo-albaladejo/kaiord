import { test } from "node:test";
import assert from "node:assert/strict";

import {
  REVIEW_QUEUE_HEADER,
  rewriteTitle,
  transformSource,
} from "./codemod-should-prefix.mjs";

test("rewriteTitle: drop-s rule for `renders`", () => {
  // Arrange / Act / Assert
  assert.equal(
    rewriteTitle("renders the calendar"),
    "should render the calendar"
  );
});

test("rewriteTitle: drop-s rule for `returns`", () => {
  // Arrange / Act / Assert
  assert.equal(
    rewriteTitle("returns null on empty input"),
    "should return null on empty input"
  );
});

test("rewriteTitle: be-substitution for `is`", () => {
  // Arrange / Act / Assert
  assert.equal(rewriteTitle("is pinned to v3"), "should be pinned to v3");
});

test("rewriteTitle: negation-elision for `does not`", () => {
  // Arrange / Act / Assert
  assert.equal(
    rewriteTitle("does not throw on missing field"),
    "should not throw on missing field"
  );
});

test("rewriteTitle: `does` (no `not`) gets `should do`", () => {
  // Arrange / Act / Assert
  assert.equal(
    rewriteTitle("does the right thing"),
    "should do the right thing"
  );
});

test("rewriteTitle: idempotent — already-prefixed title returns null", () => {
  // Arrange / Act / Assert
  assert.equal(rewriteTitle("should render"), null);
});

test("rewriteTitle: unmapped first word returns null (queue for manual)", () => {
  // Arrange / Act / Assert
  assert.equal(rewriteTitle("zarks the foo"), null);
});

test("transformSource: rewrites it() title in place", () => {
  // Arrange
  const source = `it("renders the calendar", () => {});`;

  // Act
  const { source: out, queue } = transformSource(source, "test.ts");

  // Assert
  assert.equal(out, `it("should render the calendar", () => {});`);
  assert.deepEqual(queue, []);
});

test("transformSource: preserves single-quote style", () => {
  // Arrange
  const source = `it('returns null', () => {});`;

  // Act
  const { source: out } = transformSource(source, "test.ts");

  // Assert
  assert.equal(out, `it('should return null', () => {});`);
});

test("transformSource: preserves backtick style", () => {
  // Arrange
  const source = "it(`is pinned`, () => {});";

  // Act
  const { source: out } = transformSource(source, "test.ts");

  // Assert
  assert.equal(out, "it(`should be pinned`, () => {});");
});

test("transformSource: leaves unmapped titles alone, adds to queue", () => {
  // Arrange
  const source = `it("zarks the bar", () => {});`;

  // Act
  const { source: out, queue } = transformSource(
    source,
    "packages/x/y.test.ts"
  );

  // Assert
  assert.equal(out, source);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].path, "packages/x/y.test.ts");
  assert.equal(queue[0].title, "zarks the bar");
});

test("transformSource: idempotent on already-rewritten code", () => {
  // Arrange
  const source = `it("should render", () => {});`;

  // Act
  const { source: out, queue } = transformSource(source, "test.ts");

  // Assert
  assert.equal(out, source);
  assert.deepEqual(queue, []);
});

test("transformSource: handles it.skip / it.only / it.todo / it.fails / it.each", () => {
  // Arrange
  const source = [
    `it.skip("renders X", () => {});`,
    `it.only("returns Y", () => {});`,
    `it.todo("handles Z");`,
    `it.fails("throws on bad", () => {});`,
    `it.each([1])("rejects %s", v => {});`,
  ].join("\n");

  // Act
  const { source: out } = transformSource(source, "test.ts");

  // Assert
  assert.match(out, /it\.skip\("should render X"/);
  assert.match(out, /it\.only\("should return Y"/);
  assert.match(out, /it\.todo\("should handle Z"/);
  assert.match(out, /it\.fails\("should throw on bad"/);
  assert.match(out, /it\.each\(\[1\]\)\("should reject %s"/);
});

test("transformSource: handles multiple it() calls in one file", () => {
  // Arrange
  const source = [
    `it("renders A", () => {});`,
    `it("returns B", () => {});`,
    `it("zarks unmapped", () => {});`,
  ].join("\n");

  // Act
  const { source: out, queue } = transformSource(source, "x.test.ts");

  // Assert
  assert.match(out, /it\("should render A"/);
  assert.match(out, /it\("should return B"/);
  assert.match(out, /it\("zarks unmapped"/); // unchanged
  assert.equal(queue.length, 1);
});

test("REVIEW_QUEUE_HEADER is a stable string", () => {
  // Arrange / Act / Assert
  assert.match(REVIEW_QUEUE_HEADER, /^# REVIEW_QUEUE/);
});
