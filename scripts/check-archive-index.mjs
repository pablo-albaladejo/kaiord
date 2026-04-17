#!/usr/bin/env node
// Drift guard: regenerate openspec/changes/archive/README.md in memory,
// compare against the committed version, and fail if they differ. Runs
// in CI as part of `pnpm lint:archive` so a contributor who forgets
// `pnpm archive:index` cannot merge a stale index.

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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = checkIndex();
  if (!result.ok) {
    console.error(
      `openspec/changes/archive/README.md is out of date — run \`pnpm archive:index\` and commit the diff.`
    );
    process.exit(1);
  }
  console.log("openspec/changes/archive/README.md is up to date.");
}
