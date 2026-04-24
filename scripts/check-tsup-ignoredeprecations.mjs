#!/usr/bin/env node
// Watchdog for `ignoreDeprecations: "6.0"` in tsconfig.base.json.
// tsup 8.5.1 hardcodes `baseUrl` in its dts pipeline (egoist/tsup#1388),
// triggering TS5101 under TS 6. When tsup removes that literal this
// script fails CI so the silencer is deleted instead of rotting.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const FORCED_BASEURL_PATTERN = /baseUrl:\s*compilerOptions\.baseUrl\s*\|\|/;

function resolveTsupInstallDir() {
  const pnpmDir = join(repoRoot, "node_modules", ".pnpm");
  let entries;
  try {
    entries = readdirSync(pnpmDir);
  } catch (err) {
    return {
      error: `could not read ${pnpmDir} — run \`pnpm install\` first.\n${err.message}`,
    };
  }
  const tsupDirs = entries.filter((d) => /^tsup@\d/.test(d));
  if (tsupDirs.length === 0) {
    return {
      error: `no tsup installation found under ${pnpmDir}. Run \`pnpm install\`.`,
    };
  }
  const versions = new Set(tsupDirs.map((d) => d.match(/^tsup@([^_]+)/)[1]));
  if (versions.size > 1) {
    return {
      error:
        `multiple tsup versions installed (${[...versions].join(", ")}). ` +
        `Dedupe via pnpm.overrides or update this watchdog.`,
    };
  }
  return { dir: join(pnpmDir, tsupDirs[0], "node_modules", "tsup") };
}

function silencerDeadMessage(version) {
  return (
    `[tsup-watchdog] tsup@${version} no longer forces a baseUrl in its dts\n` +
    `pipeline. Remove the silencer now:\n\n` +
    `  1. Delete "ignoreDeprecations": "6.0" from tsconfig.base.json\n` +
    `  2. Delete this watchdog script and its test\n` +
    `  3. Drop "lint:tsup-watchdog" from package.json's lint script\n\n` +
    `Tracking: https://github.com/egoist/tsup/issues/1388\n`
  );
}

const resolved = resolveTsupInstallDir();
if (resolved.error) {
  console.error(`[tsup-watchdog] ${resolved.error}`);
  process.exit(2);
}

let tsupVersion;
try {
  tsupVersion = JSON.parse(
    readFileSync(join(resolved.dir, "package.json"), "utf8")
  ).version;
} catch (err) {
  console.error(
    `[tsup-watchdog] could not read tsup's package.json — run \`pnpm install\`.\n${err.message}`
  );
  process.exit(2);
}

let rollupSrc;
try {
  rollupSrc = readFileSync(join(resolved.dir, "dist", "rollup.js"), "utf8");
} catch (err) {
  console.error(
    `[tsup-watchdog] could not read tsup's dist/rollup.js — internal structure may have changed.\n${err.message}`
  );
  process.exit(1);
}

if (FORCED_BASEURL_PATTERN.test(rollupSrc)) {
  process.exit(0);
}

console.error(silencerDeadMessage(tsupVersion));
process.exit(1);
