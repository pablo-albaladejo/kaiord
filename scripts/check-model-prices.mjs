#!/usr/bin/env node
/**
 * Mechanical guard: every model the App offers has a current price entry
 * (R-ModelPricesFresh).
 *
 * Prices change and an `@ai-sdk/*` bump can add a model, so the table goes
 * stale silently unless something looks:
 *
 * - every id in the generated catalog has exactly one entry, priced or marked
 *   `unpriced` with a reason (the App then shows its cost as unknown);
 * - every entry was read within the last 120 days, and not in the future;
 * - no entry names a model the catalog no longer offers;
 * - an entry carries prices or an unpriced reason, never both or neither;
 * - a priced entry read after quotes were kept carries the page's own line(s)
 *   for it, holding every one of its prices (`lib/model-price-entry.mjs`).
 *
 * An unreadable file and a catalog that parses to zero ids are faults.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { entryViolations, MAX_AGE_DAYS } from "./lib/model-price-entry.mjs";

const CATALOG = "packages/ai/src/providers/generated/model-catalog.ts";
const PRICES = "packages/ai/src/providers/pricing/model-prices.json";

const BLOCK = /^ {2}(anthropic|openai|google): \[([\s\S]*?)^ {2}\],/gm;
const CATALOG_ID = /\bid:\s*"([^"]+)"/g;

/** `provider:id` keys of every model in the generated catalog. */
export const catalogKeys = (source) =>
  new Set(
    [...source.matchAll(BLOCK)].flatMap(([, provider, body]) =>
      [...body.matchAll(CATALOG_ID)].map(([, id]) => `${provider}:${id}`)
    )
  );

const read = (root, file) => readFileSync(join(root, file), "utf8");

export const runCheck = ({
  root,
  catalog = CATALOG,
  prices = PRICES,
  today = new Date(),
}) => {
  let offered;
  let entries;
  try {
    offered = catalogKeys(read(root, catalog));
    entries = JSON.parse(read(root, prices)).entries;
  } catch (error) {
    return [{ kind: "scan-failed", detail: error.message }];
  }
  if (offered.size === 0)
    return [{ kind: "catalog-empty", detail: `no ids parsed from ${catalog}` }];

  const violations = entries.flatMap((e) => entryViolations(e, today));
  const seen = new Set();
  for (const entry of entries) {
    for (const id of entry.ids ?? []) {
      const key = `${entry.provider}:${id}`;
      if (seen.has(key)) violations.push({ kind: "price-duplicate", id });
      else if (!offered.has(key))
        violations.push({ kind: "price-without-model", id });
      seen.add(key);
    }
  }
  for (const key of offered) {
    if (seen.has(key)) continue;
    const [provider, id] = key.split(/:(.*)/s);
    violations.push({ kind: "model-without-price", provider, id });
  }
  return violations;
};

const main = () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const violations = runCheck({ root });
  if (violations.length === 0) {
    console.log(
      `model prices: every offered model has an entry read within ${MAX_AGE_DAYS} days.`
    );
    return;
  }
  for (const v of violations)
    console.error(
      `  [${v.kind}] ${v.provider ?? ""} ${v.id ?? v.detail ?? ""} ${v.readOn ?? v.value ?? ""}`
    );
  console.error(
    `\nRead each Provider's official pricing page again and update\n${PRICES}:\n` +
      "the prices, `readOn` (the day you read it), `source` and `quote`: the\n" +
      "page's exact line(s) for the model, holding every price. A model the\n" +
      "page does not list goes in an `unpriced` entry with a reason, so the\n" +
      "App shows its cost as unknown. Never guess a price."
  );
  process.exit(1);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
