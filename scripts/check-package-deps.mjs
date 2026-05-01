#!/usr/bin/env node
/**
 * Mechanical guard: every packages/<X>/package.json's `dependencies`
 * (and `devDependencies`) MAY only declare `@kaiord/*` workspace deps
 * that are listed for that package in `scripts/architecture.vocab.mjs`'s
 * PACKAGE_DEPS table.
 *
 * Rule R-ArchPackageDeps: codifies the canonical `Package Dependencies`
 * requirement in `openspec/specs/hexagonal-arch/spec.md`. Any extra
 * `@kaiord/<name>` entry that is NOT on the allowlist for that package is
 * rejected. Non-`@kaiord/*` deps are ignored.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0 even when
 *                violations exist. Used by scripts/audit-snapshot.mjs.
 *   (default)    Print human-readable report; exit non-zero on any
 *                violation outside the allowlist.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { PACKAGE_DEPS } from "./architecture.vocab.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_ROOT = resolve(REPO_ROOT, "packages");

// R-ArchPackageDeps: must be empty before guidelines-compliance-harden archives.
export const ALLOWLIST = new Set([]);

function relForRule(file) {
  return relative(REPO_ROOT, file).replaceAll("\\", "/");
}

function listPackageDirs(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name);
}

function readPackageJson(packageDir) {
  const file = join(packageDir, "package.json");
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function kaiordDeps(pkgJson) {
  const buckets = ["dependencies", "devDependencies", "peerDependencies"];
  const out = new Set();
  for (const bucket of buckets) {
    const deps = pkgJson?.[bucket];
    if (!deps || typeof deps !== "object") continue;
    for (const name of Object.keys(deps)) {
      if (name.startsWith("@kaiord/")) out.add(name);
    }
  }
  return [...out];
}

export function runCheck({ packagesRoot, vocab } = {}) {
  const root = packagesRoot ?? PACKAGES_ROOT;
  const allowlistByPackage = vocab ?? PACKAGE_DEPS;
  const violations = [];
  for (const dir of listPackageDirs(root)) {
    const packageDir = join(root, dir);
    const pkgJson = readPackageJson(packageDir);
    if (!pkgJson) continue;
    const allowed = new Set(allowlistByPackage[dir] ?? []);
    for (const dep of kaiordDeps(pkgJson)) {
      if (allowed.has(dep)) continue;
      const allowKey = `${dir}:${dep}`;
      if (root === PACKAGES_ROOT && ALLOWLIST.has(allowKey)) continue;
      violations.push({
        rule: "R-ArchPackageDeps",
        file: relForRule(join(packageDir, "package.json")),
        detail: `package "${dir}" declares disallowed @kaiord/* dep: ${dep}. Allowed: [${[...allowed].join(", ") || "none"}]`,
      });
    }
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
    console.log(
      "✅ Every packages/* package.json respects the deps allowlist."
    );
    process.exit(0);
  }
  console.error("❌ R-ArchPackageDeps violations:");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`    ${v.detail}`);
  }
  process.exit(1);
}
