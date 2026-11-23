// Tests for scripts/lib/model-price-entry.mjs using node:test.
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  entryViolations,
  QUOTES_REQUIRED_AFTER,
  quotedNumbers,
} from "./model-price-entry.mjs";

const TODAY = new Date("2026-12-10T12:00:00Z");
const RENEWED = "2026-12-01";

const entry = (fields) => ({
  provider: "anthropic",
  ids: ["claude-a"],
  source: "https://example.test/pricing",
  readOn: RENEWED,
  quote: null,
  periods: [
    {
      input: 1.25,
      output: 10,
      longContext: { aboveInputTokens: 200000, input: 2.5, output: 15 },
    },
  ],
  ...fields,
});

const QUOTE = [
  "Model A: $1.25 / MTok input, $10 / MTok output",
  "Prompts over 200K tokens: $2.50 / MTok input, $15.00 / MTok output",
];

const kinds = (violations) => violations.map((v) => v.kind);

test("should read prices, thousands separators and K or M suffixes from a quote", () => {
  // Arrange
  const lines = ["$1.25 / MTok, $0.10 cached", "over 200K or 1,000,000 or 1M"];

  // Act
  const numbers = quotedNumbers(lines);

  // Assert
  assert.deepEqual(
    [...numbers].sort((a, b) => a - b),
    [0.1, 1.25, 200000, 1000000]
  );
});

test("should pass a renewed entry whose every price appears in its quote", () => {
  // Arrange
  const renewed = entry({ quote: QUOTE });

  // Act
  const violations = entryViolations(renewed, TODAY);

  // Assert
  assert.deepEqual(violations, []);
});

test("should fail a renewed entry that carries no quote", () => {
  // Arrange
  // Bumping `readOn` alone, without reading the page, is the case this catches.
  const bumped = entry({ quote: null });

  // Act
  const violations = entryViolations(bumped, TODAY);

  // Assert
  assert.deepEqual(kinds(violations), ["price-unquoted"]);
});

test("should fail a renewed entry with a price its quote does not hold", () => {
  // Arrange
  const wrong = entry({
    quote: QUOTE,
    periods: [{ input: 1.5, output: 10 }],
  });

  // Act
  const violations = entryViolations(wrong, TODAY);

  // Assert
  assert.deepEqual(violations, [
    { kind: "price-not-in-quote", id: "claude-a", value: 1.5 },
  ]);
});

test("should let an entry read before quotes were kept carry none until it is renewed", () => {
  // Arrange
  const frozen = entry({ readOn: QUOTES_REQUIRED_AFTER, quote: null });
  const today = new Date("2026-11-30T12:00:00Z");

  // Act
  const violations = entryViolations(frozen, today);

  // Assert
  assert.deepEqual(violations, []);
});

test("should still expire an entry read before quotes were kept after 120 days", () => {
  // Arrange
  const frozen = entry({ readOn: QUOTES_REQUIRED_AFTER, quote: null });
  const today = new Date("2027-03-24T12:00:00Z");

  // Act
  const violations = entryViolations(frozen, today);

  // Assert
  assert.deepEqual(kinds(violations), ["price-stale"]);
});

test("should not ask an unpriced entry for a quote", () => {
  // Arrange
  const unpriced = entry({ periods: undefined, unpriced: "not listed" });

  // Act
  const violations = entryViolations(unpriced, TODAY);

  // Assert
  assert.deepEqual(violations, []);
});

test("should fail an entry whose quote is neither null nor a list of lines", () => {
  // Arrange
  const malformed = entry({ quote: "one string" });
  const missing = entry({ quote: undefined });

  // Act
  const violations = [
    ...entryViolations(malformed, TODAY),
    ...entryViolations(missing, TODAY),
  ];

  // Assert
  assert.deepEqual(kinds(violations), ["price-malformed", "price-malformed"]);
});
