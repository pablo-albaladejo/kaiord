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
 *
 * The count cap alone misses a swap (one entry removed, another added), so
 * the CLI also rejects any entry absent from the list at the merge base.
 */
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  ALLOWLIST_PACKAGE_ROOT,
  BOUNDARIES_ALLOWLIST,
  BOUNDARIES_ALLOWLIST_MAX,
} from "./boundaries-allowlist.mjs";
import { baseAllowlistFiles } from "./boundaries-allowlist-base.mjs";
import { extractImports } from "./check-architecture.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const ADAPTER_SPEC = /\badapters\//;
const SHOWN = 3;

/**
 * Collects every violation of the shrink-only invariant.
 *
 * @param {string} repoRoot Absolute path to the repository root.
 * @param {{ entries?: typeof BOUNDARIES_ALLOWLIST, baseFiles?: Set<string> }} [options]
 *   `baseFiles` are the entries at the merge base; omitted, that check is skipped.
 * @returns {string[]} Human-readable problems; empty when the ratchet holds.
 */
export function checkBoundariesAllowlist(
  repoRoot = REPO_ROOT,
  { entries = BOUNDARIES_ALLOWLIST, baseFiles } = {}
) {
  const problems = [];

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

    if (baseFiles && !baseFiles.has(file)) {
      problems.push(
        `Allowlist entry "${file}" is not in the list at the merge base. ` +
          `The allowlist is shrink-only: fix the import instead of listing it.`
      );
    }

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

    const specs = extractImports(readFileSync(abs, "utf8"));
    if (!specs.some((spec) => ADAPTER_SPEC.test(spec))) {
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

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  const baseRef = process.env.BOUNDARIES_ALLOWLIST_BASE_REF || "origin/main";
  const base = await baseAllowlistFiles({ root: REPO_ROOT, baseRef });
  const problems = [
    ...(base.error ? [base.error] : []),
    ...checkBoundariesAllowlist(REPO_ROOT, { baseFiles: base.files }),
  ];
  if (problems.length > 0) {
    console.error(
      `boundaries allowlist check failed: ${problems.length} problem(s).`
    );
    for (const p of problems.slice(0, SHOWN)) console.error(`  - ${p}`);
    if (problems.length > SHOWN)
      console.error(`  ... and ${problems.length - SHOWN} more.`);
    process.exit(1);
  }
  console.log(
    `boundaries allowlist OK: ${BOUNDARIES_ALLOWLIST.length}/${BOUNDARIES_ALLOWLIST_MAX} entries parked.`
  );
}
