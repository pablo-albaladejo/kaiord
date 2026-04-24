#!/usr/bin/env node
// Watchdog for the `ignoreDeprecations: "6.0"` setting in tsconfig.base.json.
//
// tsup 8.5.1 hardcodes `baseUrl: compilerOptions.baseUrl || "."` in its
// rolldown/dts pipeline (egoist/tsup#1388), which triggers TS 6's
// "baseUrl is deprecated" warning. We silence it at the base tsconfig
// level. When tsup removes that forced-baseUrl line, this script fails
// CI so the next developer deletes `ignoreDeprecations` instead of
// silently keeping dead config.
//
// The check grep's the INSTALLED tsup source. If the offending literal
// is gone from tsup's dist, either tsup fixed the bug or renamed the
// file — both cases warrant a human look, so the watchdog fails loudly
// and points at this file and the tsup issue.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");

// tsup is a workspace dep (not root) and pnpm does not hoist it, so it
// lives under node_modules/.pnpm/tsup@<version>_<peer-hash>/node_modules/tsup.
// Find it there — if multiple versions are installed, bail so the human
// decides which one the watchdog should track.
function resolveTsupInstallDir() {
  const pnpmDir = join(repoRoot, "node_modules", ".pnpm");
  let entries;
  try {
    entries = readdirSync(pnpmDir);
  } catch (err) {
    return { error: `could not read ${pnpmDir} — run \`pnpm install\` first.\n${err.message}` };
  }

  const tsupDirs = entries.filter((d) => /^tsup@\d/.test(d));
  if (tsupDirs.length === 0) {
    return { error: `no tsup installation found under ${pnpmDir}. Run \`pnpm install\`.` };
  }

  const versions = new Set(tsupDirs.map((d) => d.match(/^tsup@([^_]+)/)[1]));
  if (versions.size > 1) {
    return {
      error:
        `multiple tsup versions installed (${[...versions].join(", ")}). ` +
        `The watchdog tracks the hardcoded \`baseUrl\` in tsup's dts pipeline; ` +
        `with multiple versions it cannot tell which one is authoritative. ` +
        `Dedupe via pnpm.overrides or add explicit handling to the watchdog.`,
    };
  }

  return { dir: join(pnpmDir, tsupDirs[0], "node_modules", "tsup") };
}

const resolved = resolveTsupInstallDir();
if (resolved.error) {
  console.error(`[tsup-watchdog] ${resolved.error}`);
  process.exit(2);
}

const tsupPkgPath = join(resolved.dir, "package.json");
const tsupRollupPath = join(resolved.dir, "dist", "rollup.js");

let tsupVersion;
try {
  const pkg = JSON.parse(readFileSync(tsupPkgPath, "utf8"));
  tsupVersion = pkg.version;
} catch (err) {
  console.error(
    `[tsup-watchdog] could not read ${tsupPkgPath} — run \`pnpm install\` first.\n${err.message}`,
  );
  process.exit(2);
}

let rollupSrc;
try {
  rollupSrc = readFileSync(tsupRollupPath, "utf8");
} catch (err) {
  console.error(
    `[tsup-watchdog] could not read tsup's installed rollup.js at ${tsupRollupPath}.\n` +
      `tsup's internal structure may have changed. Review and update this watchdog.\n${err.message}`,
  );
  process.exit(1);
}

// The offending literal that forces baseUrl and triggers TS6 deprecation
// TS5101. If tsup still has it, our ignoreDeprecations silencer is
// justified. If tsup removed it, we can (and should) stop silencing.
const FORCED_BASEURL_PATTERN = /baseUrl:\s*compilerOptions\.baseUrl\s*\|\|/;

if (FORCED_BASEURL_PATTERN.test(rollupSrc)) {
  // tsup still forces baseUrl; ignoreDeprecations is still required.
  process.exit(0);
}

console.error(
  `[tsup-watchdog] tsup@${tsupVersion} no longer forces a baseUrl in its\n` +
    `dts pipeline. The \`"ignoreDeprecations": "6.0"\` entry in\n` +
    `tsconfig.base.json was only there to silence the TS5101 warning\n` +
    `that forced-baseUrl produced. Remove it now:\n\n` +
    `  1. Delete the "ignoreDeprecations": "6.0" line from tsconfig.base.json\n` +
    `  2. Delete this watchdog script and its test\n` +
    `  3. Drop the "tsup-watchdog" step from package.json's lint script\n\n` +
    `Tracking: https://github.com/egoist/tsup/issues/1388\n`,
);
process.exit(1);
