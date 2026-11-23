// Tests for scripts/check-model-prices.mjs using node:test.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { MAX_AGE_DAYS, runCheck } from "./check-model-prices.mjs";

const CATALOG = "catalog.ts";
const PRICES = "prices.json";
const TODAY = new Date("2026-11-23T12:00:00Z");

const catalogSource = (ids) => `export const MODEL_CATALOG = {
  anthropic: [
${ids.anthropic.map((id) => `    { id: "${id}", label: "${id}" },`).join("\n")}
  ],
  openai: [
${ids.openai.map((id) => `    { id: "${id}", label: "${id}" },`).join("\n")}
  ],
  google: [
  ],
};
`;

const priced = (provider, ids, readOn = "2026-11-23") => ({
  provider,
  ids,
  source: "https://example.test/pricing",
  readOn,
  periods: [{ input: 1, output: 2 }],
});

const setup = ({ ids, entries }) => {
  const root = mkdtempSync(join(tmpdir(), "model-prices-"));
  for (const [file, text] of [
    [CATALOG, catalogSource(ids)],
    [PRICES, JSON.stringify({ unit: "USD", entries })],
  ]) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  }
  return { root, catalog: CATALOG, prices: PRICES, today: TODAY };
};

const kinds = (violations) => violations.map((v) => v.kind);

test("should pass when every offered model has a fresh entry", () => {
  // Arrange
  const args = setup({
    ids: { anthropic: ["claude-a"], openai: ["gpt-a"] },
    entries: [
      priced("anthropic", ["claude-a"]),
      {
        ...priced("openai", ["gpt-a"]),
        periods: undefined,
        unpriced: "not listed",
      },
    ],
  });

  // Act
  const violations = runCheck(args);

  // Assert
  assert.deepEqual(violations, []);
});

test("should fail when an offered model has no price entry", () => {
  // Arrange
  const args = setup({
    ids: { anthropic: ["claude-a", "claude-b"], openai: [] },
    entries: [priced("anthropic", ["claude-a"])],
  });

  // Act
  const violations = runCheck(args);

  // Assert
  assert.deepEqual(violations, [
    { kind: "model-without-price", provider: "anthropic", id: "claude-b" },
  ]);
});

test("should fail when an entry was read more than 120 days ago", () => {
  // Arrange: 2026-07-25 is 121 days before 2026-11-23; 2026-07-26 is 120
  const args = setup({
    ids: { anthropic: ["claude-a", "claude-b"], openai: [] },
    entries: [
      priced("anthropic", ["claude-a"], "2026-07-25"),
      priced("anthropic", ["claude-b"], "2026-07-26"),
    ],
  });

  // Act
  const violations = runCheck(args);

  // Assert
  assert.equal(MAX_AGE_DAYS, 120);
  assert.deepEqual(kinds(violations), ["price-stale"]);
  assert.equal(violations[0].id, "claude-a");
});

test("should fail on an entry for a model the App does not offer, or listed twice", () => {
  // Arrange
  const args = setup({
    ids: { anthropic: ["claude-a"], openai: [] },
    entries: [
      priced("anthropic", ["claude-a", "claude-gone"]),
      priced("anthropic", ["claude-a"]),
    ],
  });

  // Act
  const violations = runCheck(args);

  // Assert
  assert.deepEqual(kinds(violations).sort(), [
    "price-duplicate",
    "price-without-model",
  ]);
});

test("should fail when an entry has neither prices nor an unpriced reason, or a date in the future", () => {
  // Arrange
  const args = setup({
    ids: { anthropic: ["claude-a", "claude-b"], openai: [] },
    entries: [
      { ...priced("anthropic", ["claude-a"]), periods: undefined },
      priced("anthropic", ["claude-b"], "2026-12-01"),
    ],
  });

  // Act
  const violations = runCheck(args);

  // Assert
  assert.deepEqual(kinds(violations).sort(), [
    "price-future",
    "price-malformed",
  ]);
});

test("should treat an empty catalog or an unreadable table as a fault, not a pass", () => {
  // Arrange
  const empty = setup({ ids: { anthropic: [], openai: [] }, entries: [] });
  const missing = { ...empty, prices: "nope.json" };

  // Act
  const fromEmpty = runCheck(empty);
  const fromMissing = runCheck(missing);

  // Assert
  assert.deepEqual(kinds(fromEmpty), ["catalog-empty"]);
  assert.deepEqual(kinds(fromMissing), ["scan-failed"]);
});
