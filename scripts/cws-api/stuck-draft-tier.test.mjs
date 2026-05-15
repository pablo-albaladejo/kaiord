// Tests for scripts/cws-api/stuck-draft-tier.mjs using node:test.

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { bumpRetryCount, parseRetryCount } from "./stuck-draft-tier.mjs";

test("parseRetryCount returns null when marker missing", () => {
  assert.equal(parseRetryCount("just a human body, nothing here"), null);
  assert.equal(parseRetryCount(""), null);
  assert.equal(parseRetryCount("RETRY: 1"), null);
});

test("parseRetryCount returns null for non-string and nullish input", () => {
  assert.equal(parseRetryCount(null), null);
  assert.equal(parseRetryCount(undefined), null);
  assert.equal(parseRetryCount(42), null);
});

test("parseRetryCount parses a valid integer marker", () => {
  assert.equal(parseRetryCount("RETRY_COUNT: 0"), 0);
  assert.equal(parseRetryCount("RETRY_COUNT: 2"), 2);
  assert.equal(parseRetryCount("Body before\nRETRY_COUNT: 7\nBody after"), 7);
});

test("parseRetryCount tolerates CRLF, leading/trailing whitespace", () => {
  assert.equal(parseRetryCount("RETRY_COUNT:   3\r\n"), 3);
  assert.equal(parseRetryCount("   RETRY_COUNT:   4   \r\n"), 4);
  assert.equal(parseRetryCount("foo\r\nRETRY_COUNT: 5\r\nbar"), 5);
});

test("parseRetryCount returns null on malformed values", () => {
  // Non-integer markers (NaN, empty, decimal) all yield null because the
  // marker regex requires `(-?\d+)` followed by optional whitespace and EOL.
  assert.equal(parseRetryCount("RETRY_COUNT: NaN"), null);
  assert.equal(parseRetryCount("RETRY_COUNT: "), null);
  assert.equal(parseRetryCount("RETRY_COUNT: 1.5"), null);
});

test("parseRetryCount parses sentinel -1", () => {
  assert.equal(parseRetryCount("RETRY_COUNT: -1"), -1);
});

test("parseRetryCount does not throw on weird shapes", () => {
  // The parser MUST NOT throw on any input.
  assert.doesNotThrow(() => parseRetryCount(" "));
  assert.doesNotThrow(() => parseRetryCount("a".repeat(10000)));
  assert.doesNotThrow(() => parseRetryCount({}));
  assert.doesNotThrow(() => parseRetryCount([]));
});

test("bumpRetryCount inserts marker at 0 when missing", () => {
  const out = bumpRetryCount("# Title\n\nSome body\n");
  assert.match(out, /RETRY_COUNT: 0/);
  assert.ok(out.endsWith("RETRY_COUNT: 0\n"));
});

test("bumpRetryCount inserts marker when body is empty", () => {
  assert.equal(bumpRetryCount(""), "RETRY_COUNT: 0\n");
});

test("bumpRetryCount increments existing marker", () => {
  const body = "Header\nRETRY_COUNT: 2\nFooter";
  assert.equal(bumpRetryCount(body), "Header\nRETRY_COUNT: 3\nFooter");
});

test("bumpRetryCount preserves sentinel -1", () => {
  const body = "Header\nRETRY_COUNT: -1\nFooter";
  // Sentinel stays sentinel; an escalated draft does not auto-bump.
  assert.equal(bumpRetryCount(body), "Header\nRETRY_COUNT: -1\nFooter");
});

test("bumpRetryCount normalizes CRLF on output", () => {
  const body = "Header\r\nRETRY_COUNT: 1\r\nFooter\r\n";
  const out = bumpRetryCount(body);
  assert.ok(!out.includes("\r\n"));
  assert.match(out, /RETRY_COUNT: 2/);
});

test("bumpRetryCount inserts marker when previous value was malformed", () => {
  const body = "RETRY_COUNT: notanumber";
  const out = bumpRetryCount(body);
  assert.match(out, /RETRY_COUNT: 0/);
});
