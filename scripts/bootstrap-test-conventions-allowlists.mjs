#!/usr/bin/env node
// One-shot allowlist seeder for the test-conventions-should-aaa change.
//
// Walks every *.test.{ts,tsx} file in scope (same exclusion list as
// the test-convention guards) and emits, on stdout, four block-quoted
// regions whose contents are pasted into:
//
//   scripts/check-test-title-should.mjs       (TITLE_ALLOWLIST)
//   scripts/check-test-aaa.mjs                (AAA_ALLOWLIST_BACKEND,
//                                              AAA_ALLOWLIST_SPA_NON_COMPONENT,
//                                              AAA_ALLOWLIST_SPA_COMPONENT)
//
// The seeder is migration-window-only — deleted by PR-6 §6.10c once
// all four allowlists are drained to empty. Re-run between PRs (per
// tasks.md §2.0/§3.0a/§4.0/§5.0) to capture net-new violators that
// landed during prior PR review windows.
//
// Title-rule violator: any it()/it.alias()/it.each([])() call whose
// title literal does NOT start with the literal seven characters
// `s`,`h`,`o`,`u`,`l`,`d`,space (case-sensitive lowercase). Reported
// as `<repo-relative-path>:<line>`.
//
// AAA-rule violator: a *.test.{ts,tsx} file in scope that contains
// at least one it() call AND has fewer canonical-Pascal-case
// `// Arrange` markers than it() calls. Files with lowercase `//
// arrange` variants are violators (the migration normalizes them).
// Reported as repo-relative file paths, partitioned into three
// shards per design D4.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");

const EXCLUDED_FRAGMENTS = [
  "/node_modules/",
  "/dist/",
  "/coverage/",
  "/test-utils/",
  "/e2e/",
  "/.storybook/",
];
const EXCLUDED_BASENAMES = new Set(["test-setup.ts"]);

// Regex contracts (must stay in sync with the guards):
// - Title: any `it`-rooted call followed by a quoted title.
const IT_TITLE_RE =
  /\bit\b(?:\.[a-z]+)?\s*\([^"'`]{0,400}?(["'`])([A-Za-z][^"'`]*)\1/g;
// - it() call detector (counts how many it()-rooted calls a file has)
const IT_CALL_RE = /\bit\b(?:\.[a-z]+)?\s*\(/g;
// - canonical Pascal-case Arrange/Act/Assert markers (must match all
//   three to be a conformant file; same heuristic as the guard).
const ARRANGE_MARKER_RE = /^\s*\/\/\s+Arrange\s*$/gm;
const ACT_MARKER_RE = /^\s*\/\/\s+Act\s*$/gm;
const ASSERT_MARKER_RE = /^\s*\/\/\s+Assert\s*$/gm;

function existsDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const relPosix = relative(REPO_ROOT, full).replaceAll("\\", "/");
    if (EXCLUDED_FRAGMENTS.some((frag) => relPosix.includes(frag))) continue;
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (EXCLUDED_BASENAMES.has(entry.name)) continue;
    if (!entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx"))
      continue;
    out.push(full);
  }
}

export function listTestFiles(rootDir = PACKAGES_DIR) {
  const files = [];
  if (!existsDir(rootDir)) return files;
  walk(rootDir, files);
  return files.sort();
}

function lineOf(source, charIndex) {
  let line = 1;
  for (let i = 0; i < charIndex; i++) {
    if (source.charCodeAt(i) === 10) line++;
  }
  return line;
}

export function findTitleViolators(source) {
  const out = [];
  for (const match of source.matchAll(IT_TITLE_RE)) {
    const title = match[2];
    if (title.startsWith("should ")) continue;
    const titleStartIdx = match.index + match[0].lastIndexOf(title);
    out.push({ line: lineOf(source, titleStartIdx), title });
  }
  return out;
}

export function isAaaViolator(source) {
  const itCount = (source.match(IT_CALL_RE) || []).length;
  if (itCount === 0) return false;
  const arrangeCount = (source.match(ARRANGE_MARKER_RE) || []).length;
  if (arrangeCount < itCount) return true;
  const actCount = (source.match(ACT_MARKER_RE) || []).length;
  if (actCount < itCount) return true;
  const assertCount = (source.match(ASSERT_MARKER_RE) || []).length;
  if (assertCount < itCount) return true;
  return false;
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

export function classifyShard(repoRelPath) {
  const p = repoRelPath.replaceAll("\\", "/");
  if (p.startsWith("packages/workout-spa-editor/")) {
    if (SPA_NON_COMPONENT_PREFIXES.some((pre) => p.startsWith(pre)))
      return "SPA_NON_COMPONENT";
    if (SPA_COMPONENT_PREFIXES.some((pre) => p.startsWith(pre)))
      return "SPA_COMPONENT";
    // Roots like App.test.tsx / routes.test.tsx land in SPA_COMPONENT
    // (per tasks.md §5.1 sweep clause).
    return "SPA_COMPONENT";
  }
  return "BACKEND";
}

export function bootstrap(files = listTestFiles()) {
  const titleViolators = []; // { repoPath, line, title }
  const aaaShards = {
    BACKEND: [],
    SPA_NON_COMPONENT: [],
    SPA_COMPONENT: [],
  };

  for (const file of files) {
    const repoPath = relative(REPO_ROOT, file).replaceAll("\\", "/");
    const source = readFileSync(file, "utf8");

    for (const v of findTitleViolators(source)) {
      titleViolators.push({ repoPath, line: v.line, title: v.title });
    }

    if (isAaaViolator(source)) {
      const shard = classifyShard(repoPath);
      aaaShards[shard].push(repoPath);
    }
  }

  // Sort lexicographically within each output for stable diffs.
  titleViolators.sort((a, b) => {
    if (a.repoPath !== b.repoPath) return a.repoPath.localeCompare(b.repoPath);
    return a.line - b.line;
  });
  for (const shard of Object.keys(aaaShards)) aaaShards[shard].sort();

  return { titleViolators, aaaShards };
}

function formatBlock(label, entries, lineSelector) {
  const lines = entries.map(lineSelector);
  return `=== ${label} (${entries.length} entries) ===\n${lines.join("\n")}`;
}

function formatOutput({ titleViolators, aaaShards }) {
  return [
    formatBlock(
      "TITLE_ALLOWLIST",
      titleViolators,
      (v) => `  "${v.repoPath}:${v.line}",`
    ),
    formatBlock(
      "AAA_ALLOWLIST_BACKEND",
      aaaShards.BACKEND,
      (p) => `  "${p}",`
    ),
    formatBlock(
      "AAA_ALLOWLIST_SPA_NON_COMPONENT",
      aaaShards.SPA_NON_COMPONENT,
      (p) => `  "${p}",`
    ),
    formatBlock(
      "AAA_ALLOWLIST_SPA_COMPONENT",
      aaaShards.SPA_COMPONENT,
      (p) => `  "${p}",`
    ),
  ].join("\n\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = bootstrap();
  console.log(formatOutput(result));
  console.error(
    `\n[bootstrap-test-conventions-allowlists] ` +
      `${result.titleViolators.length} title violators, ` +
      `${result.aaaShards.BACKEND.length} backend AAA, ` +
      `${result.aaaShards.SPA_NON_COMPONENT.length} SPA-non-component AAA, ` +
      `${result.aaaShards.SPA_COMPONENT.length} SPA-component AAA.`
  );
}
