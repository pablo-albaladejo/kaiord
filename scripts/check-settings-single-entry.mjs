#!/usr/bin/env node
/**
 * Mechanical guard: when `ux2026.unifiedSettings` is `true` in
 * `packages/workout-spa-editor/src/lib/feature-flags.ts`, no file
 * under `packages/workout-spa-editor/src/components/**` (outside the
 * approved ALLOWLIST) may import `SettingsPanel` or `ProfileManager`
 * directly. The canonical Settings destination is `/settings/<tab>`.
 *
 * Rule R-SettingsSingleEntry — when the flag is `true`:
 *
 *   import { SettingsPanel } from ".../SettingsPanel/...";
 *   import { ProfileManager } from ".../ProfileManager/...";
 *
 * Both shapes fail CI unless the importing file path is in ALLOWLIST.
 * When the flag is `false`, the guard is a no-op so the strangler
 * period stays unblocked.
 *
 * ALLOWLIST is intentionally empty in production initial — see
 * design D9 (R-PIIInterpolation) for the same shape.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

const IMPORT_PATTERN =
  /import\s+(?:type\s+)?\{[^}]*\b(SettingsPanel|ProfileManager)\b[^}]*\}\s+from\s+["'][^"']*(?:SettingsPanel|ProfileManager)/;

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
  const match = flagsSource.match(
    /"ux2026\.unifiedSettings"\s*:\s*(true|false)/
  );
  if (!match) return false;
  return match[1] === "true";
}

export function checkSingleEntry(content, filePath, allowlist = ALLOWLIST) {
  const errors = [];
  if (allowlist.has(filePath)) return errors;
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (IMPORT_PATTERN.test(line)) {
      const symbol = line.match(IMPORT_PATTERN)?.[1] ?? "(unknown)";
      errors.push(
        `R-SettingsSingleEntry: ${filePath}:${idx + 1} — direct import of ${symbol} is forbidden when ux2026.unifiedSettings is true; route through /settings/<tab> instead`
      );
    }
  });
  return errors;
}

function main() {
  const flagsSource = readFileSync(FLAGS_PATH, "utf8");
  if (!isFlagEnabled(flagsSource)) {
    console.log(
      "R-SettingsSingleEntry: ux2026.unifiedSettings is false — guard is a no-op."
    );
    return;
  }
  const files = walk(SCAN_ROOT);
  let totalErrors = 0;
  for (const file of files) {
    const relativePath = relative(REPO_ROOT, file);
    const content = readFileSync(file, "utf8");
    const errors = checkSingleEntry(content, relativePath);
    if (errors.length > 0) {
      for (const error of errors) console.error(error);
      totalErrors += errors.length;
    }
  }
  if (totalErrors > 0) {
    console.error(
      `\nR-SettingsSingleEntry: ${totalErrors} forbidden direct import(s) found.`
    );
    process.exit(1);
  }
  console.log(
    `R-SettingsSingleEntry: scanned ${files.length} files — no direct SettingsPanel/ProfileManager imports.`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
