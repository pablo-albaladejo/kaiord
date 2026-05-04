#!/usr/bin/env node
//
// Migration-state allowlist (drained to empty by PR-6). See design.md
// D5 "Two distinct allowlist patterns" for the distinction from the
// exception-allowlist pattern in scripts/check-no-pii-leakage.mjs.
//
// Rule R-ItBodyAAA.
//
// Enforces: every it()/it.<alias>(...) body in any in-scope
// *.test.{ts,tsx} file SHALL contain canonical Pascal-case line
// comments `// Arrange`, `// Act`, `// Assert` (case-sensitive,
// no trailing punctuation), one per `it()` call.
//
// Implementation: count-based heuristic — file is a violator if
// (#it-calls > #canonical-Arrange-markers) OR
// (#it-calls > #canonical-Act-markers) OR
// (#it-calls > #canonical-Assert-markers). The bootstrap script uses
// the same heuristic to seed the allowlists. Stricter checks (per-it
// ordering, blank-line separators) are spec-bound but not enforced
// at PR-1 ship-time; the migration's subagent prompt produces ordered
// + blank-line-separated markers, and PR-6 may tighten the heuristic.
//
// Three sharded allowlists per design D4 — disjoint sub-Sets so PR-3
// (BACKEND), PR-4 (SPA_NON_COMPONENT), PR-5 (SPA_COMPONENT) ship in
// parallel without merge conflicts on this file.
//
// CLI:
//   node scripts/check-test-aaa.mjs           # full-tree
//   node scripts/check-test-aaa.mjs --changed-files
//
// `--changed-files` mode mirrors check-test-title-should.mjs.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");

// MIGRATION-STATE ALLOWLISTS — sharded per D4. Each sub-Set is
// drained independently by its corresponding migration PR
// (PR-3 → BACKEND, PR-4 → SPA_NON_COMPONENT, PR-5 → SPA_COMPONENT).
// All three SHALL be `new Set()` after PR-5.
//
// Format: repo-relative POSIX file paths (no line numbers — file-
// level allowlist per D4).
let AAA_ALLOWLIST_BACKEND = new Set();

let AAA_ALLOWLIST_SPA_NON_COMPONENT = new Set();

let AAA_ALLOWLIST_SPA_COMPONENT = new Set();

export function __setAllowlistsForTest({
  BACKEND,
  SPA_NON_COMPONENT,
  SPA_COMPONENT,
}) {
  AAA_ALLOWLIST_BACKEND = BACKEND;
  AAA_ALLOWLIST_SPA_NON_COMPONENT = SPA_NON_COMPONENT;
  AAA_ALLOWLIST_SPA_COMPONENT = SPA_COMPONENT;
}

const EXCLUDED_FRAGMENTS = [
  "/node_modules/",
  "/dist/",
  "/coverage/",
  "/test-utils/",
  "/e2e/",
  "/.storybook/",
];
const EXCLUDED_BASENAMES = new Set(["test-setup.ts"]);

function isInScope(repoRelPath) {
  const p = repoRelPath.replaceAll("\\", "/");
  if (EXCLUDED_FRAGMENTS.some((frag) => p.includes(frag))) return false;
  if (p.startsWith("node_modules/")) return false;
  if (p.startsWith("dist/")) return false;
  if (p.startsWith("coverage/")) return false;
  if (p.endsWith(".stories.ts") || p.endsWith(".stories.tsx")) return false;
  const base = p.split("/").pop();
  if (EXCLUDED_BASENAMES.has(base)) return false;
  if (!p.endsWith(".test.ts") && !p.endsWith(".test.tsx")) return false;
  return true;
}

const SPA_NON_COMPONENT_PREFIXES = [
  "packages/workout-spa-editor/src/application/",
  "packages/workout-spa-editor/src/adapters/",
  "packages/workout-spa-editor/src/store/",
  "packages/workout-spa-editor/src/hooks/",
  "packages/workout-spa-editor/src/lib/",
];
const SPA_COMPONENT_PREFIXES = [
  "packages/workout-spa-editor/src/components/",
  "packages/workout-spa-editor/src/pages/",
];

export function inferShard(repoRelPath) {
  const p = repoRelPath.replaceAll("\\", "/");
  if (p.startsWith("packages/workout-spa-editor/")) {
    if (SPA_NON_COMPONENT_PREFIXES.some((pre) => p.startsWith(pre)))
      return "SPA_NON_COMPONENT";
    if (SPA_COMPONENT_PREFIXES.some((pre) => p.startsWith(pre)))
      return "SPA_COMPONENT";
    return "SPA_COMPONENT";
  }
  return "BACKEND";
}

// Shared `it`-call counter — strips string-literal contents so
// titles like `"opens it (twice)"` don't false-positive as a 5th
// `it()`-call. PR-6 §6.2 graduated this away from the loose IT_CALL_RE.
import { countItCalls } from "./it-title-extractor.mjs";

const ARRANGE_RE = /^\s*\/\/\s+Arrange\s*$/gm;
const ACT_RE = /^\s*\/\/\s+Act\s*$/gm;
const ASSERT_RE = /^\s*\/\/\s+Assert\s*$/gm;

export function hasCanonicalMarkers(source) {
  const itCount = countItCalls(source);
  if (itCount === 0) return true;
  const arrangeCount = (source.match(ARRANGE_RE) || []).length;
  if (arrangeCount < itCount) return false;
  const actCount = (source.match(ACT_RE) || []).length;
  if (actCount < itCount) return false;
  const assertCount = (source.match(ASSERT_RE) || []).length;
  if (assertCount < itCount) return false;
  return true;
}

function isAllowlisted(repoRelPath) {
  return (
    AAA_ALLOWLIST_BACKEND.has(repoRelPath) ||
    AAA_ALLOWLIST_SPA_NON_COMPONENT.has(repoRelPath) ||
    AAA_ALLOWLIST_SPA_COMPONENT.has(repoRelPath)
  );
}

function findFiles({ packagesDir = PACKAGES_DIR } = {}) {
  const files = [];
  if (!existsSync(packagesDir)) return files;
  walk(packagesDir, files);
  return files;
}

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(REPO_ROOT, full).replaceAll("\\", "/");
    if (EXCLUDED_FRAGMENTS.some((frag) => rel.includes(frag))) continue;
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!isInScope(rel)) continue;
    out.push(full);
  }
}

export function collectAaaViolations({
  packagesDir = PACKAGES_DIR,
  repoRoot = REPO_ROOT,
  files,
} = {}) {
  const targetFiles = files !== undefined ? files : findFiles({ packagesDir });
  const violations = [];
  for (const file of targetFiles) {
    const rel = relative(repoRoot, file).replaceAll("\\", "/");
    if (!isInScope(rel)) continue;
    if (isAllowlisted(rel)) continue;
    const source = readFileSync(file, "utf8");
    if (!hasCanonicalMarkers(source)) {
      violations.push({ path: rel, shard: inferShard(rel) });
    }
  }
  return { violations };
}

function gitChangedTestFiles() {
  try {
    const out = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
      { cwd: REPO_ROOT, encoding: "utf8" }
    ).trim();
    if (!out) return [];
    return out
      .split(/\n/)
      .filter((p) => isInScope(p))
      .map((p) => resolve(REPO_ROOT, p));
  } catch {
    return [];
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const changedFilesMode = process.argv.includes("--changed-files");
  const opts = changedFilesMode ? { files: gitChangedTestFiles() } : {};
  if (changedFilesMode && opts.files.length === 0) {
    process.exit(0);
  }
  const { violations } = collectAaaViolations(opts);
  if (violations.length > 0) {
    for (const v of violations) {
      console.error(
        `R-ItBodyAAA: ${v.path} — file is missing AAA markers (or markers out of order); see openspec/specs/test-conventions/spec.md for the canonical form.`
      );
    }
    console.error(
      `\n${violations.length} AAA violation(s). Each it() body MUST contain canonical Pascal-case // Arrange, // Act, // Assert line comments.`
    );
    process.exit(1);
  }
  if (!changedFilesMode) {
    console.log(
      `[check-test-aaa] all in-scope test files contain canonical AAA markers.`
    );
  }
}
