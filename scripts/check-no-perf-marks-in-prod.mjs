#!/usr/bin/env node
/**
 * Permanent invariant: production bundles of `@kaiord/workout-spa-editor`
 * SHALL NOT contain `performance.mark` calls or the literal mark name
 * `useMatchedSessions` originating from the `useMatchedSessions` hook.
 *
 * The hook gates its perf instrumentation behind
 * `import.meta.env.DEV || import.meta.env.MODE === "test"` so Vite's
 * transform tree-shakes the calls out of production builds. This script
 * reads the actual `dist/assets/*.js` output and asserts that property
 * — far more reliable than mocking `import.meta.env.PROD` in Vitest
 * (Vite resolves `import.meta.env` at transform time, so the runtime
 * mock is moot).
 *
 * Invocation:
 *   pnpm test:scripts                    # included in the suite
 *   node scripts/check-no-perf-marks-in-prod.mjs  # direct
 *   node scripts/check-no-perf-marks-in-prod.mjs --skip-build
 *
 * The default mode runs `pnpm --filter @kaiord/workout-spa-editor build`
 * before grepping; `--skip-build` reuses an existing `dist/` (faster
 * for local iteration).
 */

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SPA_DIR = resolve(REPO_ROOT, "packages", "workout-spa-editor");
const DIST_ASSETS = resolve(SPA_DIR, "dist", "assets");

const FORBIDDEN_PATTERNS = [
  // Direct API call surfaced from the hook's gated branch.
  /performance\.mark\s*\(/,
  // The exported mark-name constant from use-matched-sessions-perf.ts.
  /useMatchedSessions:start/,
  /useMatchedSessions:end/,
];

const buildIfNeeded = (skipBuild) => {
  if (skipBuild) return;
  execSync("pnpm --filter @kaiord/workout-spa-editor build", {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
};

const listJsFiles = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJsFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".js")) out.push(path);
  }
  return out;
};

export function runCheck({ assetsDir = DIST_ASSETS } = {}) {
  const violations = [];
  let exists = true;
  try {
    statSync(assetsDir);
  } catch {
    exists = false;
  }
  if (!exists) {
    return [
      {
        rule: "R-NoPerfMarksInProd",
        file: assetsDir,
        detail:
          "dist/assets/ does not exist; build the SPA first (pnpm --filter @kaiord/workout-spa-editor build) before running this check, or omit --skip-build.",
      },
    ];
  }
  for (const file of listJsFiles(assetsDir)) {
    const source = readFileSync(file, "utf8");
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(source)) {
        violations.push({
          rule: "R-NoPerfMarksInProd",
          file: file.replace(REPO_ROOT + "/", ""),
          detail: `Production bundle leaks the perf instrumentation (${pattern}). The hook's import.meta.env gate is not stripping the call. See use-matched-sessions.ts.`,
        });
      }
    }
  }
  return violations;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const skipBuild = process.argv.includes("--skip-build");
  buildIfNeeded(skipBuild);
  const violations = runCheck();
  if (violations.length === 0) {
    console.log(
      "✅ Production SPA bundle contains no useMatchedSessions perf marks."
    );
    process.exit(0);
  }
  console.error("❌ R-NoPerfMarksInProd violations:");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`    ${v.detail}`);
  }
  process.exit(1);
}
