#!/usr/bin/env node
/**
 * Mechanical guard: husky hooks MUST NOT endorse their own bypass.
 *
 * Rule R-NoBypassHint: any line under .husky/* that ENDORSES, INSTRUCTS,
 * or PROVIDES a recipe for bypassing the hook is rejected. The forbidden
 * pattern is imperative-voice framing — `echo "use --no-verify"`,
 * `printf "HUSKY=0 ..."`, `: HUSKY=0 ...`, `eval "HUSKY=0 ..."`,
 * `env HUSKY=0 ...`, `something && HUSKY=0 ...`, `$(HUSKY=0 ...)`,
 * `bash -c "HUSKY=0 ..."`, etc.
 *
 * Defensive comments are EXPLICITLY ALLOWED:
 *   # NEVER use --no-verify; CI re-runs all checks anyway
 *   # do not use HUSKY=0
 *   # --no-verify is forbidden
 *
 * The script distinguishes by checking for negation tokens on the same
 * line: NEVER, do not, don't, forbidden, never use, must not, prohibited,
 * not allowed, disallowed, banned. Bare `#`-comments WITHOUT a negation
 * token are REJECTED — contributors MUST include explicit negation
 * framing for the rule to recognize the comment as defensive.
 *
 * GPG signing policy is OUT OF SCOPE for this rule. `--no-gpg-sign` is
 * a separate signing-policy concern and is NOT enforced here. A future
 * `repo-quality-gates` change MAY add R-NoGpgBypass.
 *
 * Known evasions accepted as residual risk (documented for transparency):
 *   - `bash <<<` here-strings with internal vars
 *   - `bash <<EOF` heredocs (rare in husky hooks)
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0 even when
 *                violations exist. Used by scripts/audit-snapshot.mjs.
 *   (default)    Print human-readable report; exit non-zero on any
 *                violation outside the allowlist.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const HUSKY_DIR = resolve(REPO_ROOT, ".husky");

// Imperative-voice tokens that signal endorsement of the bypass.
const IMPERATIVE_RE =
  /(\buse\b|\btry\b|\brun\b|\bexecute\b|\bexec\b|\beval\b|\benv\b|\bexport\b|:\s|&&|\|\||\$\(|\becho\b|\bprintf\b|\bbash\s+-c\b|\bsh\s+-c\b)/i;

// Negation tokens that signal a defensive comment.
const NEGATION_RE =
  /\b(NEVER|DO\s+NOT|DON'?T|FORBIDDEN|MUST\s+NOT|PROHIBITED|NOT\s+ALLOWED|DISALLOWED|BANNED)\b/i;

// Bypass primitives this rule cares about (excluding --no-gpg-sign).
const BYPASS_RE = /(--no-verify|HUSKY=0)/;

// R-NoBypassHint: must be empty before guidelines-compliance-harden archives.
// Each entry MUST carry an inline comment naming (a) the rule ID, (b) the
// offending file, (c) the planned drain PR.
export const ALLOWLIST = new Set([
  // Pre-existing imperative-voice bypass instructions in .husky/pre-commit
  // (repeated 5×) are seeded here. Drained in PR1's task 1.8.2 (this same PR)
  // when the imperative-voice lines are removed from .husky/pre-commit.
  // The rule is wired into pnpm test:scripts; CI is green during PR1
  // because the instruction lines get removed in the same PR.
]);

function safeStat(p) {
  try {
    return statSync(p);
  } catch {
    return null;
  }
}

function listHuskyFiles(dir) {
  const out = [];
  const stat = safeStat(dir);
  if (!stat || !stat.isDirectory()) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "_") continue; // husky internals dir
    if (entry.isFile()) out.push(join(dir, entry.name));
  }
  return out;
}

function relForRule(file) {
  return relative(REPO_ROOT, file).replaceAll("\\", "/");
}

function checkFile(file) {
  const violations = [];
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");
  const rel = relForRule(file);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!BYPASS_RE.test(line)) continue;
    if (NEGATION_RE.test(line)) continue;
    if (!IMPERATIVE_RE.test(line)) continue;
    violations.push({
      rule: "R-NoBypassHint",
      file: rel,
      line: i + 1,
      detail: `imperative-voice bypass instruction: ${line.trim()}`,
    });
  }
  return violations;
}

export function runCheck({ huskyDir } = {}) {
  const dir = huskyDir ?? HUSKY_DIR;
  const violations = [];
  for (const file of listHuskyFiles(dir)) {
    for (const v of checkFile(file)) {
      const allowKey = `${v.file}:${v.line}`;
      if (huskyDir == null && ALLOWLIST.has(allowKey)) continue;
      violations.push(v);
    }
  }
  return violations;
}

const isMain =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const dryRun = process.argv.includes("--dry-run");
  const violations = runCheck();
  if (dryRun) {
    process.stdout.write(JSON.stringify(violations, null, 2) + "\n");
    process.exit(0);
  }
  if (violations.length === 0) {
    console.log("✅ No husky bypass-hint detected.");
    process.exit(0);
  }
  console.error("❌ R-NoBypassHint violations:");
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}:${v.line}`);
    console.error(`    ${v.detail}`);
  }
  process.exit(1);
}
