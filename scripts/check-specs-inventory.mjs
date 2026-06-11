#!/usr/bin/env node
// Drift guard: regenerate openspec/specs/README.md in memory, compare
// against the committed version, and fail if they differ. Runs in CI as
// part of `pnpm lint` (wired as `pnpm lint:specs-inventory`, sibling of
// `pnpm lint:archive-index`) so a contributor who forgets
// `pnpm specs:inventory` cannot merge a stale inventory. On mismatch,
// prints the first differing lines to make the failure self-explanatory.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildInventory } from "./generate-specs-inventory.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const README = join(REPO_ROOT, "openspec", "specs", "README.md");

export function checkInventory() {
  const expected = buildInventory();
  if (!expected) {
    return { ok: true, reason: "no specs directory; nothing to check" };
  }
  const actual = existsSync(README) ? readFileSync(README, "utf8") : "";
  if (actual !== expected) {
    return { ok: false, expected, actual };
  }
  return { ok: true };
}

function firstDiff(expected, actual) {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const max = Math.max(expectedLines.length, actualLines.length);
  for (let i = 0; i < max; i++) {
    if (expectedLines[i] !== actualLines[i]) {
      return {
        line: i + 1,
        expected: expectedLines[i] ?? "<missing>",
        actual: actualLines[i] ?? "<missing>",
      };
    }
  }
  return null;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = checkInventory();
  if (result.ok) {
    console.log("✅ openspec/specs/README.md is up to date.");
    process.exit(0);
  }
  const diff = firstDiff(result.expected, result.actual);
  console.error("❌ openspec/specs/README.md is stale.");
  if (diff) {
    console.error(`  first difference at line ${diff.line}:`);
    console.error(`    expected: ${diff.expected}`);
    console.error(`    actual:   ${diff.actual}`);
  }
  console.error("  run `pnpm specs:inventory` and commit the result.");
  process.exit(1);
}
