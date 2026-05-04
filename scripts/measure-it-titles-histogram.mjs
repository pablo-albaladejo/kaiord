#!/usr/bin/env node
// Measurement helper for the test-conventions-should-aaa change.
//
// Walks every *.test.{ts,tsx} file in scope (the same exclusion list
// the test-convention guards apply: e2e/, stories, test-utils,
// test-setup.ts, node_modules, dist, coverage) and emits, on stdout,
// a histogram of the first word of every it(...)/it.<alias>(...)/
// it.each([...])(...) title literal. Output format is one line per
// distinct first-word, sorted by descending count:
//
//     <count> <first-word>
//
// The measurement re-runs at PR-2 §2.1 against the codemod's verb
// table; the same script powers both PR-1 ship-time bootstrap and
// PR-2 re-measurement so the numbers are reproducible bit-for-bit
// across machines.
//
// Regex-based scan (matches existing scripts/check-*.mjs precedent;
// no TypeScript Compiler API dep). The exclusion-list filtering is
// path-prefix based; the title-extracting regex is liberal — it
// matches plain `it(`, `it.skip|only|todo|fails|concurrent(`, AND
// `it.each([...])(` chained calls.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");

// Excluded path fragments (POSIX-style, matched against repo-relative
// path with forward slashes). Keep in sync with the spec's scope rule.
const EXCLUDED_FRAGMENTS = [
  "/node_modules/",
  "/dist/",
  "/coverage/",
  "/test-utils/",
  "/e2e/",
  "/.storybook/",
];

// Excluded basenames.
const EXCLUDED_BASENAMES = new Set(["test-setup.ts"]);

// Title-extracting regex.
//
// `\bit\b`            — the literal `it` as a whole word.
// `(?:\.[a-z]+)?`     — optional `.skip`, `.only`, `.todo`, `.each`,
//                       `.fails`, `.concurrent`, `.runIf`, etc.
// `\s*\(`             — open paren of the first call.
// `[^"'`]{0,400}?`    — up to 400 non-quote chars (handles the array
//                       arg of `it.each([1, 2])` as long as no string
//                       literal lives inside it; tests never have
//                       string literals in the it.each table because
//                       table-driven titles use placeholders).
// `["'\`]`            — opening quote of the title literal.
// `([A-Za-z][^"'\`]*)` — title body starting with a letter; first
//                       capture group.
// `["'\`]`            — closing quote (same kind, but we don't
//                       enforce backreference for liberal matching).
const IT_TITLE_RE =
  /\bit\b(?:\.[a-z]+)?\s*\([^"'`]{0,400}?["'`]([A-Za-z][^"'`]*)["'`]/g;

export function listTestFiles(rootDir = PACKAGES_DIR) {
  const files = [];
  if (!existsDir(rootDir)) return files;
  walk(rootDir, files);
  return files;
}

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

export function extractFirstWords(source) {
  const words = [];
  for (const match of source.matchAll(IT_TITLE_RE)) {
    const title = match[1].trim();
    const firstWord = title.split(/\s+/)[0];
    if (firstWord) words.push(firstWord);
  }
  return words;
}

export function measureHistogram(files) {
  const counts = new Map();
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const word of extractFirstWords(source)) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return counts;
}

export function formatHistogram(counts) {
  const sorted = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
  return sorted.map(([word, count]) => `${count} ${word}`).join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = listTestFiles();
  const counts = measureHistogram(files);
  const out = formatHistogram(counts);
  if (out) console.log(out);
  console.error(
    `\n[measure-it-titles-histogram] scanned ${files.length} test files; ${counts.size} distinct first-words.`
  );
}
