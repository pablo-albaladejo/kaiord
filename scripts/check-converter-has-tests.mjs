#!/usr/bin/env node
/**
 * Mechanical guard: every *.converter.ts MUST have a co-located
 * *.converter.test.ts (or .tsx) sibling in the SAME directory.
 *
 * Rule R-ConverterHasTests: any file under packages/** matching
 *   *.converter.{ts,tsx}
 * lacking a sibling *.converter.test.{ts,tsx} in the same directory
 * is rejected. Per `testing-standards`: non-trivial logic in a
 * converter MUST be tested co-located. Indirect coverage from
 * integration suites does not count for this rule.
 *
 * Allowlist semantics mirror scripts/check-no-pii-leakage.mjs: each
 * entry is a repo-relative POSIX path with an inline comment naming
 * the rule, the offending file, and the planned drain PR. The
 * production allowlist MUST be empty before guidelines-compliance-harden
 * archives.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0 even when
 *                violations exist. Used by scripts/audit-snapshot.mjs.
 *   (default)    Print human-readable report; exit non-zero on any
 *                violation outside the allowlist.
 */

import { existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { findPackageFiles } from "./lib/find-package-files.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_ROOT = resolve(REPO_ROOT, "packages");

const CONVERTER_RE = /\.converter\.(ts|tsx)$/;
const CONVERTER_TEST_RE = /\.converter\.(test|spec)\.(ts|tsx)$/;

// R-ConverterHasTests: drained in PR3 of guidelines-compliance-harden.
// The previously seeded entries (3 untested *.converter.ts files) were
// resolved by adding co-located characterization tests. The set is
// intentionally empty; new entries MUST NOT be added without an
// OpenSpec amendment to the source-of-truth change.
export const ALLOWLIST = new Set([]);

function relForRule(file) {
  return relative(REPO_ROOT, file).replaceAll("\\", "/");
}

function siblingTestExists(converterPath) {
  // Strip .converter.{ts,tsx} → expect .converter.test.{ts,tsx} or
  // .converter.spec.{ts,tsx} in the SAME directory.
  const baseTs = converterPath.replace(CONVERTER_RE, ".converter.test.ts");
  const baseTsx = converterPath.replace(CONVERTER_RE, ".converter.test.tsx");
  const specTs = converterPath.replace(CONVERTER_RE, ".converter.spec.ts");
  const specTsx = converterPath.replace(CONVERTER_RE, ".converter.spec.tsx");
  return (
    existsSync(baseTs) ||
    existsSync(baseTsx) ||
    existsSync(specTs) ||
    existsSync(specTsx)
  );
}

export function runCheck({ packagesRoot } = {}) {
  const root = packagesRoot ?? PACKAGES_ROOT;
  const converters = findPackageFiles(
    root,
    (file) => CONVERTER_RE.test(file) && !CONVERTER_TEST_RE.test(file)
  );
  const violations = [];
  for (const file of converters) {
    if (siblingTestExists(file)) continue;
    const rel = relative(
      root === PACKAGES_ROOT ? REPO_ROOT : root,
      file
    ).replaceAll("\\", "/");
    const isAllowed = root === PACKAGES_ROOT && ALLOWLIST.has(rel);
    if (isAllowed) continue;
    violations.push({
      rule: "R-ConverterHasTests",
      file: rel,
      detail:
        "*.converter.{ts,tsx} files MUST have a co-located " +
        `*.converter.test.{ts,tsx} sibling. Expected: ${rel.replace(
          CONVERTER_RE,
          ".converter.test.$1"
        )}`,
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
    console.log("✅ Every *.converter.{ts,tsx} has a sibling test.");
    process.exit(0);
  }
  console.error("❌ R-ConverterHasTests violations:");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`    ${v.detail}`);
  }
  process.exit(1);
}
