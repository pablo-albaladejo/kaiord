#!/usr/bin/env node
//
// Migration-state allowlist (drained to empty by PR-6). See design.md
// D5 "Two distinct allowlist patterns" for the distinction from the
// exception-allowlist pattern in scripts/check-no-pii-leakage.mjs:
// this guard's allowlist starts non-empty and ends empty by PR-6;
// scripts/check-no-pii-leakage.mjs's allowlist starts empty and stays
// that way (each addition needs a justification).
//
// Rule R-ItTitleShould.
//
// Enforces: every it()/it.<alias>(...)/it.each([...])(...) call in
// any in-scope *.test.{ts,tsx} file SHALL pass a string-literal or
// template-literal first argument whose textual prefix (after stripping
// vitest substitution placeholders %s, %d, %i, %j, %o, %#, $1, $2,
// $prop) equals "should " (case-sensitive lowercase).
//
// Out of scope: e2e/, *.stories.{ts,tsx}, test-utils/, test-setup.ts,
// node_modules/, dist/, coverage/. See spec.md "Scope" exclusion list.
//
// CLI:
//   node scripts/check-test-title-should.mjs           # full-tree
//   node scripts/check-test-title-should.mjs --changed-files
//
// `--changed-files` reads `git diff --cached --name-only --diff-filter=ACMR`
// and inspects only staged *.test.{ts,tsx} files. Used by husky pre-commit
// to keep the hook's wall-clock budget under 1.5s on a 5-file changeset.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");

// MIGRATION-STATE ALLOWLIST — seeded from
// `node scripts/bootstrap-test-conventions-allowlists.mjs`. Drained
// to empty by PR-2 (codemod) per design D4. Re-bootstrapped at every
// migration PR's branch base (tasks.md §2.0/§3.0a/§4.0/§5.0) for
// net-new violators landed during prior PR review windows.
//
// Format: `<repo-relative-path>:<line>` (POSIX path separators).
let ALLOWLIST = new Set([]);

// Hook for tests — allows tests to substitute a controlled allowlist.
export function __setAllowlistForTest(allowlist) {
  ALLOWLIST = allowlist;
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

export function isInScope(repoRelPath) {
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

// Vitest substitution placeholders per https://vitest.dev/api/#test-each
// %s, %d, %i, %j, %o, %#, $1, $2, $prop (named).
const PLACEHOLDER_RE = /%[sdijo#]|\$\d+|\$[a-zA-Z_][a-zA-Z0-9_]*/g;

export function stripPlaceholders(title) {
  return title.replace(PLACEHOLDER_RE, "");
}

// Title extraction delegated to the shared helper; the helper does
// two regex passes to correctly handle `it.each([...])(title)` (a
// naive single-regex matches the inner array's quoted strings).
import { findItTitles } from "./it-title-extractor.mjs";

const VERB_REWRITE_HINTS = {
  renders: "should render",
  returns: "should return",
  is: "should be",
  does: "should do",
  rejects: "should reject",
  accepts: "should accept",
  throws: "should throw",
  shows: "should show",
  hides: "should hide",
  fires: "should fire",
  emits: "should emit",
  calls: "should call",
  uses: "should use",
  maps: "should map",
  replaces: "should replace",
  preserves: "should preserve",
  removes: "should remove",
  passes: "should pass",
  updates: "should update",
  focuses: "should focus",
  falls: "should fall",
  resolves: "should resolve",
  includes: "should include",
};

function suggestRewrite(title) {
  const firstWord = title.split(/\s+/)[0];
  const rest = title.slice(firstWord.length);
  const lc = firstWord.toLowerCase();
  if (lc === "does" && /^\s+not\b/.test(rest)) {
    return `should not${rest.slice(4)}`;
  }
  if (VERB_REWRITE_HINTS[lc]) {
    return VERB_REWRITE_HINTS[lc] + rest;
  }
  return null;
}

function lineOf(source, charIndex) {
  let line = 1;
  for (let i = 0; i < charIndex; i++) {
    if (source.charCodeAt(i) === 10) line++;
  }
  return line;
}

export function findFiles({ packagesDir = PACKAGES_DIR } = {}) {
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

export function findTitleViolatorsInFile(source) {
  const out = [];
  for (const { title, titleStart } of findItTitles(source)) {
    const stripped = stripPlaceholders(title);
    if (stripped.startsWith("should ")) continue;
    out.push({ line: lineOf(source, titleStart), title });
  }
  return out;
}

export function collectTitleViolations({
  packagesDir = PACKAGES_DIR,
  repoRoot = REPO_ROOT,
  files,
} = {}) {
  const targetFiles = files !== undefined ? files : findFiles({ packagesDir });
  const violations = [];
  for (const file of targetFiles) {
    const rel = relative(repoRoot, file).replaceAll("\\", "/");
    if (!isInScope(rel)) continue;
    const source = readFileSync(file, "utf8");
    for (const v of findTitleViolatorsInFile(source)) {
      const key = `${rel}:${v.line}`;
      if (ALLOWLIST.has(key)) continue;
      violations.push({
        path: rel,
        line: v.line,
        title: v.title,
      });
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
  const { violations } = collectTitleViolations(opts);
  if (violations.length > 0) {
    for (const v of violations) {
      const rewrite = suggestRewrite(v.title);
      const hint = rewrite
        ? `Suggested rewrite: "${rewrite}".`
        : `Suggested rewrite: (manual rewrite required — see openspec/specs/test-conventions/spec.md).`;
      console.error(
        `R-ItTitleShould: ${v.path}:${v.line} — title "${v.title}" must start with "should ". ${hint}`
      );
    }
    console.error(
      `\n${violations.length} title violation(s). See openspec/specs/test-conventions/spec.md for the canonical rule.`
    );
    process.exit(1);
  }
  if (!changedFilesMode) {
    console.log(
      `[check-test-title-should] all in-scope it() titles start with "should ".`
    );
  }
}
