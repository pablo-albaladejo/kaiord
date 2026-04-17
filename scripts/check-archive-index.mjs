#!/usr/bin/env node
// Drift guard: regenerate openspec/changes/archive/README.md in memory,
// compare against the committed version, and fail if they differ. Runs
// in CI as part of `pnpm lint` (wired as `pnpm lint:archive-index`,
// sibling of the folder-date invariant `pnpm lint:archive`) so a
// contributor who forgets `pnpm archive:index` cannot merge a stale
// index. On mismatch, prints the first differing lines to make the
// failure self-explanatory without a separate diff run.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildIndex } from "./generate-archive-index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const README = join(
  REPO_ROOT,
  "openspec",
  "changes",
  "archive",
  "README.md"
);

export function checkIndex() {
  const expected = buildIndex();
  if (!expected) {
    return { ok: true, reason: "no archive directory; nothing to check" };
  }
  const actual = existsSync(README) ? readFileSync(README, "utf8") : "";
  if (actual !== expected) {
    return { ok: false, expected, actual };
  }
  return { ok: true };
}

function firstDiff(expected, actual, context = 2) {
  const eLines = expected.split("\n");
  const aLines = actual.split("\n");
  const max = Math.max(eLines.length, aLines.length);
  for (let i = 0; i < max; i++) {
    if (eLines[i] !== aLines[i]) {
      const start = Math.max(0, i - context);
      const out = [];
      for (let j = start; j <= Math.min(i + context, max - 1); j++) {
        const e = eLines[j] ?? "<EOF>";
        const a = aLines[j] ?? "<EOF>";
        const marker = e === a ? " " : "!";
        out.push(`  ${marker} L${j + 1}`);
        out.push(`     expected: ${e}`);
        out.push(`     actual:   ${a}`);
      }
      return out.join("\n");
    }
  }
  return "";
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = checkIndex();
  if (!result.ok) {
    console.error(
      `openspec/changes/archive/README.md is out of date — run \`pnpm archive:index\` and commit the diff.\n`
    );
    if (result.expected != null && result.actual != null) {
      console.error("First differing lines (expected vs actual):\n");
      console.error(firstDiff(result.expected, result.actual));
    }
    process.exit(1);
  }
  console.log("openspec/changes/archive/README.md is up to date.");
}
