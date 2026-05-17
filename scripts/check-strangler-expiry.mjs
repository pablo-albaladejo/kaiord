#!/usr/bin/env node
//
// Mechanical guard: every `// @strangler-until: YYYY-MM-DD` marker in
// `packages/workout-spa-editor/src/**` MUST have a date that is on or
// after today. Past dates fail CI, forcing the strangler shim to be
// deleted (or its TTL extended with explicit justification).
//
// Rule R-StranglerExpiry — single rule, single shape:
//
//   // @strangler-until: YYYY-MM-DD
//
// Anything else (missing date, malformed date, past date) fails.
//
// CLI:
//   node scripts/check-strangler-expiry.mjs            # full-tree
//   node scripts/check-strangler-expiry.mjs --changed-files
//
// `--changed-files` mode mirrors check-test-aaa.mjs.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SCAN_ROOT = resolve(REPO_ROOT, "packages/workout-spa-editor/src");
const MARKER = /\/\/\s*@strangler-until:\s*(\S+)\s*$/;
const MAX_REPORTED_PATHS = 3;

const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
]);

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

export function checkStranglerExpiry(content, filePath, today = new Date()) {
  const errors = [];
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const match = line.match(MARKER);
    if (!match) return;
    const dateStr = match[1];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      errors.push(
        `R-StranglerExpiry: ${filePath}:${idx + 1} — malformed date "${dateStr}" (expected YYYY-MM-DD)`
      );
      return;
    }
    const expiry = new Date(`${dateStr}T23:59:59Z`);
    if (Number.isNaN(expiry.getTime())) {
      errors.push(
        `R-StranglerExpiry: ${filePath}:${idx + 1} — invalid date "${dateStr}"`
      );
      return;
    }
    if (expiry.getTime() < today.getTime()) {
      errors.push(
        `R-StranglerExpiry: ${filePath}:${idx + 1} — strangler-until ${dateStr} has passed (today ${today.toISOString().slice(0, 10)}); delete the shim or extend the TTL with justification`
      );
    }
  });
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
  const today = new Date();
  const changedFilesMode = process.argv.includes("--changed-files");
  const files = changedFilesMode ? gitChangedFiles() : walk(SCAN_ROOT);
  if (changedFilesMode && files.length === 0) return;
  const offendingPaths = new Set();
  let totalErrors = 0;
  const sampleErrors = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const errors = checkStranglerExpiry(content, file, today);
    if (errors.length === 0) continue;
    offendingPaths.add(file);
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
      "R-StranglerExpiry: %d expired strangler marker(s) across %d file(s).",
      totalErrors,
      offendingPaths.size
    );
    process.exit(1);
  }
  if (!changedFilesMode) {
    console.log(
      "R-StranglerExpiry: scanned %d files — no expired strangler markers.",
      files.length
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
