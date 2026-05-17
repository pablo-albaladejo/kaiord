#!/usr/bin/env node
//
// Mechanical guard: when `ux2026.unifiedSettings` is `true` in
// `packages/workout-spa-editor/src/lib/feature-flags.ts`, no file
// under `packages/workout-spa-editor/src/components/**` (outside the
// approved ALLOWLIST) may import `SettingsPanel` or `ProfileManager`
// directly. The canonical Settings destination is `/settings/<tab>`.
//
// Rule R-SettingsSingleEntry — when the flag is `true`:
//
//   import { SettingsPanel } from ".../SettingsPanel/...";
//   import { ProfileManager } from ".../ProfileManager/...";
//
// Both shapes fail CI unless the importing file path is in ALLOWLIST.
// When the flag is `false`, the guard is a no-op so the strangler
// period stays unblocked.
//
// ALLOWLIST is intentionally empty initially — see design D9
// (R-PIIInterpolation) for the same shape.
//
// CLI:
//   node scripts/check-settings-single-entry.mjs            # full-tree
//   node scripts/check-settings-single-entry.mjs --changed-files

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const SCAN_ROOT = resolve(
  REPO_ROOT,
  "packages/workout-spa-editor/src/components"
);
const FLAGS_PATH = resolve(
  REPO_ROOT,
  "packages/workout-spa-editor/src/lib/feature-flags.ts"
);

export const ALLOWLIST = new Set();

const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
]);

// Tolerant flag-state matcher: accepts either string key (single or
// double quoted) or bare identifier key, with optional whitespace.
const FLAG_PATTERN =
  /(?:"ux2026\.unifiedSettings"|'ux2026\.unifiedSettings'|\bux2026\.unifiedSettings\b)\s*:\s*(true|false)/;

// Multiline-aware import detector. The `s` flag lets `.` cross
// newlines so split-across-lines imports are still caught.
const IMPORT_PATTERN =
  /import\s+(?:type\s+)?\{[^}]*\b(SettingsPanel|ProfileManager)\b[^}]*\}\s+from\s+["'][^"']*(?:SettingsPanel|ProfileManager)[^"']*["']/s;

const IMPORT_STATEMENT_RE = /import\s[^;]*?;/gs;
const MAX_REPORTED_PATHS = 3;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

export function isFlagEnabled(flagsSource) {
  const match = flagsSource.match(FLAG_PATTERN);
  if (!match) return false;
  return match[1] === "true";
}

function lineOfOffset(content, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < content.length; i++) {
    if (content.charCodeAt(i) === 10) line++;
  }
  return line;
}

export function checkSingleEntry(content, filePath, allowlist = ALLOWLIST) {
  const errors = [];
  if (allowlist.has(filePath)) return errors;
  let match;
  while ((match = IMPORT_STATEMENT_RE.exec(content)) !== null) {
    const stmt = match[0];
    const m = stmt.match(IMPORT_PATTERN);
    if (!m) continue;
    const symbol = m[1];
    const line = lineOfOffset(content, match.index);
    errors.push(
      `R-SettingsSingleEntry: ${filePath}:${line} — direct import of ${symbol} is forbidden when ux2026.unifiedSettings is true; route through /settings/<tab> instead`
    );
  }
  return errors;
}

function gitChangedFiles() {
  try {
    const out = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
      { cwd: REPO_ROOT, encoding: "utf8" }
    ).trim();
    if (!out) return [];
    const scanRel = relative(REPO_ROOT, SCAN_ROOT).replaceAll("\\", "/");
    return out
      .split(/\n/)
      .filter((p) => /\.(ts|tsx)$/.test(p) && p.startsWith(`${scanRel}/`))
      .map((p) => resolve(REPO_ROOT, p));
  } catch {
    return [];
  }
}

function main() {
  const flagsSource = readFileSync(FLAGS_PATH, "utf8");
  if (!isFlagEnabled(flagsSource)) {
    console.log(
      "R-SettingsSingleEntry: ux2026.unifiedSettings is false — guard is a no-op."
    );
    return;
  }
  const changedFilesMode = process.argv.includes("--changed-files");
  const files = changedFilesMode ? gitChangedFiles() : walk(SCAN_ROOT);
  if (changedFilesMode && files.length === 0) return;
  const offendingPaths = new Set();
  let totalErrors = 0;
  const sampleErrors = [];
  for (const file of files) {
    const relativePath = relative(REPO_ROOT, file);
    const content = readFileSync(file, "utf8");
    const errors = checkSingleEntry(content, relativePath);
    if (errors.length === 0) continue;
    offendingPaths.add(relativePath);
    totalErrors += errors.length;
    if (sampleErrors.length < MAX_REPORTED_PATHS) {
      const remaining = MAX_REPORTED_PATHS - sampleErrors.length;
      sampleErrors.push(...errors.slice(0, remaining));
    }
  }
  if (totalErrors > 0) {
    for (const message of sampleErrors) console.error("%s", message);
    if (offendingPaths.size > MAX_REPORTED_PATHS) {
      const extra = offendingPaths.size - MAX_REPORTED_PATHS;
      console.error("…and %d more file(s) with violations", extra);
    }
    console.error(
      "R-SettingsSingleEntry: %d forbidden direct import(s) across %d file(s).",
      totalErrors,
      offendingPaths.size
    );
    process.exit(1);
  }
  if (!changedFilesMode) {
    console.log(
      "R-SettingsSingleEntry: scanned %d files — no direct SettingsPanel/ProfileManager imports.",
      files.length
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
