#!/usr/bin/env node
/**
 * Enforces the shrink-only invariant on the `boundaries/dependencies`
 * allowlist (rule R-BoundariesAllowlistShrinkOnly).
 *
 * The allowlist exists only because the guard was dead long enough to
 * accumulate debt. It is a ratchet: it may shrink, never grow. A "stale"
 * entry — a file that no longer imports `adapters/` — must be deleted from
 * the list, otherwise the list silently stops reflecting reality and a future
 * regression in that file would be re-admitted for free.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ALLOWLIST_PACKAGE_ROOT,
  BOUNDARIES_ALLOWLIST,
  BOUNDARIES_ALLOWLIST_MAX,
} from "./boundaries-allowlist.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Matches any import/export whose specifier reaches into `adapters/`. */
const ADAPTER_IMPORT = /from\s+["'][^"']*\badapters\/[^"']*["']/;

/**
 * Collects every violation of the shrink-only invariant.
 *
 * @param {string} repoRoot Absolute path to the repository root.
 * @returns {string[]} Human-readable problems; empty when the ratchet holds.
 */
export function checkBoundariesAllowlist(repoRoot = REPO_ROOT) {
  const problems = [];
  const entries = BOUNDARIES_ALLOWLIST;

  if (entries.length > BOUNDARIES_ALLOWLIST_MAX) {
    problems.push(
      `Allowlist grew to ${entries.length} entries (max ${BOUNDARIES_ALLOWLIST_MAX}). ` +
        `The allowlist is shrink-only: fix the import instead of listing it.`
    );
  }

  const seen = new Set();
  for (const { file, reason } of entries) {
    if (seen.has(file)) problems.push(`Duplicate allowlist entry: ${file}`);
    seen.add(file);

    if (!reason || reason.trim().length < 40) {
      problems.push(
        `Allowlist entry "${file}" needs a reason explaining why it is still parked.`
      );
    }

    const abs = join(repoRoot, ALLOWLIST_PACKAGE_ROOT, file);
    if (!existsSync(abs)) {
      problems.push(
        `Allowlist entry "${file}" no longer exists. Delete it from the list.`
      );
      continue;
    }

    if (!ADAPTER_IMPORT.test(readFileSync(abs, "utf8"))) {
      problems.push(
        `Allowlist entry "${file}" no longer imports adapters/. ` +
          `Delete it from the list and lower BOUNDARIES_ALLOWLIST_MAX.`
      );
    }
  }

  const sorted = [...entries]
    .map((e) => e.file)
    .sort((a, b) => a.localeCompare(b));
  if (sorted.join("\n") !== entries.map((e) => e.file).join("\n")) {
    problems.push("Allowlist entries must stay sorted by file path.");
  }

  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const problems = checkBoundariesAllowlist();
  if (problems.length > 0) {
    console.error("boundaries allowlist check failed:\n");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(
    `boundaries allowlist OK: ${BOUNDARIES_ALLOWLIST.length}/${BOUNDARIES_ALLOWLIST_MAX} entries parked.`
  );
}
