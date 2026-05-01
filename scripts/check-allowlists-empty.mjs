#!/usr/bin/env node
/**
 * Permanent invariant: every `scripts/check-*.mjs` SHALL declare its
 * `ALLOWLIST` as either `new Set()` or `new Set([])` (empty Set literal).
 *
 * Rule R-AllowlistsEmpty.
 *
 * After the guidelines-compliance-harden change archives, this guard is
 * the source-of-truth for the "no future PR may re-seed any drained
 * allowlist without an OpenSpec amendment" invariant. During the
 * cleanup PRs (PR1, PR2, PR3) — when 4 of the new guards have non-empty
 * seed allowlists — this script is invoked with `--mode=warn` (exit 0,
 * informational). At task 5.5 in the final-validation block, the call
 * site is flipped to default `--mode=error` (exit non-zero on any match).
 *
 * Implementation: glob scripts/check-*.mjs (excluding self + any
 * *.test.mjs); strip line + block comments before regex match (so
 * documentation about the rule does not trigger); regex anchors on a
 * real `const ALLOWLIST = new Set([` declaration followed by an opening
 * quote of a string entry. `new Set()` (no array literal) and
 * `new Set([])` (empty array) both pass.
 *
 * Modes:
 *   --mode=warn     Print warnings; exit 0 even when violations exist.
 *                   Used during PR1/PR2/PR3 while seed allowlists exist.
 *   --mode=error    (default) Exit non-zero on any violation. Permanent
 *                   invariant after the change archives.
 *   --dry-run       Emit violations as JSON on stdout; exit 0.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const SCRIPTS_DIR = resolve(REPO_ROOT, "scripts");

const NON_EMPTY_ALLOWLIST_RE =
  /^(?:\s*export\s+)?const\s+ALLOWLIST\s*=\s*new\s+Set\(\s*\[\s*['"`]/m;

const BLOCK_COMMENT_RE = /\/\*[\s\S]*?\*\//g;
const LINE_COMMENT_RE = /(^|[^:])\/\/[^\n]*/g;

const SELF = "check-allowlists-empty.mjs";

function relForRule(file) {
  return relative(REPO_ROOT, file).replaceAll("\\", "/");
}

function stripComments(src) {
  let out = src.replace(BLOCK_COMMENT_RE, (m) => m.replace(/[^\n]/g, " "));
  out = out.replace(LINE_COMMENT_RE, (m, prefix) =>
    prefix + " ".repeat(m.length - prefix.length)
  );
  return out;
}

function listCheckScripts(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.startsWith("check-")) continue;
    if (!entry.name.endsWith(".mjs")) continue;
    if (entry.name.endsWith(".test.mjs")) continue;
    if (entry.name === SELF) continue;
    out.push(join(dir, entry.name));
  }
  return out;
}

export function runCheck({ scriptsDir } = {}) {
  const dir = scriptsDir ?? SCRIPTS_DIR;
  const violations = [];
  for (const file of listCheckScripts(dir)) {
    const source = readFileSync(file, "utf8");
    const cleaned = stripComments(source);
    if (NON_EMPTY_ALLOWLIST_RE.test(cleaned)) {
      violations.push({
        rule: "R-AllowlistsEmpty",
        file: relForRule(file),
        detail:
          "ALLOWLIST is non-empty. After guidelines-compliance-harden archives, every scripts/check-*.mjs ALLOWLIST MUST be `new Set()` or `new Set([])`. To re-seed, propose an OpenSpec amendment.",
      });
    }
  }
  return violations;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const dryRun = process.argv.includes("--dry-run");
  let mode = "error";
  for (const arg of process.argv.slice(2)) {
    if (arg === "--mode=warn") mode = "warn";
    else if (arg === "--mode=error") mode = "error";
  }
  const violations = runCheck();
  if (dryRun) {
    process.stdout.write(JSON.stringify(violations, null, 2) + "\n");
    process.exit(0);
  }
  if (violations.length === 0) {
    console.log("✅ Every scripts/check-*.mjs ALLOWLIST is empty.");
    process.exit(0);
  }
  if (mode === "warn") {
    console.warn(
      "⚠️  R-AllowlistsEmpty (warn-mode): non-empty seed allowlists present:"
    );
    for (const v of violations) {
      console.warn(`  [${v.rule}] ${v.file}`);
    }
    console.warn(
      "   These are expected during guidelines-compliance-harden cleanup PRs."
    );
    console.warn(
      "   At task 5.5 (final validation), this script flips to --mode=error."
    );
    process.exit(0);
  }
  console.error("❌ R-AllowlistsEmpty violations:");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`    ${v.detail}`);
  }
  process.exit(1);
}
