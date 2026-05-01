#!/usr/bin/env node
/**
 * Mechanical guard: *.mapper.ts files MUST NOT have co-located tests.
 *
 * Rule R-MapperNoTests: any file under packages/** matching
 *   *.mapper.test.{ts,tsx} or *.mapper.spec.{ts,tsx}
 * is rejected. The convention from `testing-standards` is that mappers
 * are pure field-to-field transformations with nothing logic-shaped to
 * test. A mapper that grew non-trivial logic SHOULD be renamed to
 * *.converter.{ts,tsx} (which then MUST have tests under the inverse
 * rule R-ConverterHasTests).
 *
 * Allowlist semantics mirror scripts/check-no-pii-leakage.mjs: each
 * entry is a repo-relative POSIX path with an inline comment naming
 * the rule, the offending file, and the planned drain PR. The
 * production allowlist MUST be empty before guidelines-compliance-harden
 * archives. After archive, scripts/check-allowlists-empty.mjs enforces
 * permanence.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0 even when
 *                violations exist. Used by scripts/audit-snapshot.mjs.
 *   (default)    Print human-readable report; exit non-zero on any
 *                violation outside the allowlist.
 */

import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { findPackageFiles } from "./lib/find-package-files.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_ROOT = resolve(REPO_ROOT, "packages");

const MAPPER_TEST_RE = /\.mapper\.(test|spec)\.(ts|tsx)$/;

// R-MapperNoTests: drained in PR3 of guidelines-compliance-harden. The
// previously seeded entries (7 *.mapper.test.{ts,tsx} files) were
// resolved by renaming each pair to *.converter.{ts,tsx}. The set is
// intentionally empty; new entries MUST NOT be added without an
// OpenSpec amendment to the source-of-truth change.
export const ALLOWLIST = new Set([]);

function relForRule(file) {
  return relative(REPO_ROOT, file).replaceAll("\\", "/");
}

export function runCheck({ packagesRoot } = {}) {
  const root = packagesRoot ?? PACKAGES_ROOT;
  const matches = findPackageFiles(root, (file) => MAPPER_TEST_RE.test(file));
  const violations = [];
  for (const file of matches) {
    const rel = relative(
      root === PACKAGES_ROOT ? REPO_ROOT : root,
      file
    ).replaceAll("\\", "/");
    const allowKey = root === PACKAGES_ROOT ? rel : rel;
    const isAllowed = root === PACKAGES_ROOT && ALLOWLIST.has(allowKey);
    if (isAllowed) continue;
    violations.push({
      rule: "R-MapperNoTests",
      file: rel,
      detail:
        "*.mapper.{ts,tsx} files MUST NOT have co-located tests. " +
        "Rename the source + this test to *.converter.{ts,tsx}, or delete " +
        "the test if the mapper is truly trivial.",
    });
  }
  return violations;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const dryRun = process.argv.includes("--dry-run");
  const violations = runCheck();
  if (dryRun) {
    process.stdout.write(JSON.stringify(violations, null, 2) + "\n");
    process.exit(0);
  }
  if (violations.length === 0) {
    console.log("✅ No mapper test files detected.");
    process.exit(0);
  }
  console.error("❌ R-MapperNoTests violations:");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`    ${v.detail}`);
  }
  process.exit(1);
}
