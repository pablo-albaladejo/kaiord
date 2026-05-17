#!/usr/bin/env node
/**
 * Mechanical guard: every `// @strangler-until: YYYY-MM-DD` marker in
 * `packages/workout-spa-editor/src/**` MUST have a date that is on or
 * after today. Past dates fail CI, forcing the strangler shim to be
 * deleted (or its TTL extended with explicit justification).
 *
 * Rule R-StranglerExpiry — single rule, single shape:
 *
 *   // @strangler-until: YYYY-MM-DD
 *
 * Anything else (missing date, malformed date, past date) fails. The
 * marker is intended to outlive its scope only as long as the date
 * allows; this guard enforces that contract.
 *
 * Mirror pattern: scripts/check-archive-dates.mjs.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const SCAN_ROOT = resolve(REPO_ROOT, "packages/workout-spa-editor/src");
const MARKER = /\/\/\s*@strangler-until:\s*(\S+)\s*$/;

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

function main() {
  const today = new Date();
  const files = walk(SCAN_ROOT);
  let totalErrors = 0;
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const errors = checkStranglerExpiry(content, file, today);
    if (errors.length > 0) {
      for (const error of errors) console.error(error);
      totalErrors += errors.length;
    }
  }
  if (totalErrors > 0) {
    console.error(
      `\nR-StranglerExpiry: ${totalErrors} expired strangler marker(s) found.`
    );
    process.exit(1);
  }
  console.log(
    `R-StranglerExpiry: scanned ${files.length} files — no expired strangler markers.`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
