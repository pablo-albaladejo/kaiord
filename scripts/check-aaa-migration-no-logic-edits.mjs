#!/usr/bin/env node
// Migration-window guard for the test-conventions-should-aaa change.
//
// REMOVED at PR-6 §6.10b (no steady-state purpose). Recovery clause
// per §6.10b: if any of PR-3 / PR-4 / PR-5 is reverted post-PR-6,
// this script SHALL be restored as part of the recovery PR before
// the redo PR opens (preserves the feedback_mechanical_over_ai rule's
// post-condition contract for any AAA-marker re-application work).
//
// CLI:
//   node scripts/check-aaa-migration-no-logic-edits.mjs [--base=<ref>]
//   --base default: process.env.MIGRATION_BASE || 'origin/main'
//   CI invocation: --base=$(git merge-base origin/main HEAD)
//
// Behavior: for every *.test.{ts,tsx} file changed between <base>..HEAD,
// tokenizes the base and HEAD versions with the TypeScript scanner
// (skipping trivia and comments), and asserts the resulting token
// sequences are equal. Comment-only edits — exactly what an AAA-marker
// migration produces — pass. Any other diff (string literal change,
// added expect() call, statement reorder, number-literal change)
// fails with the file path and the divergent token's line.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// Trivia kinds the scanner emits between meaningful tokens. Filtered
// out before comparison so comment-only diffs pass cleanly.
const TRIVIA_KINDS = new Set([
  ts.SyntaxKind.SingleLineCommentTrivia,
  ts.SyntaxKind.MultiLineCommentTrivia,
  ts.SyntaxKind.NewLineTrivia,
  ts.SyntaxKind.WhitespaceTrivia,
  ts.SyntaxKind.ShebangTrivia,
  ts.SyntaxKind.ConflictMarkerTrivia,
]);

export function scanTokens(source) {
  const tokens = [];
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    /* skipTrivia */ false,
    ts.LanguageVariant.JSX,
    source
  );
  let kind = scanner.scan();
  while (kind !== ts.SyntaxKind.EndOfFileToken) {
    if (!TRIVIA_KINDS.has(kind)) {
      tokens.push({
        kind,
        text: scanner.getTokenText(),
        line:
          source.slice(0, scanner.getTokenStart()).split(/\n/).length,
      });
    }
    kind = scanner.scan();
  }
  return tokens;
}

export function compareSources(baseSource, headSource) {
  const baseTokens = scanTokens(baseSource);
  const headTokens = scanTokens(headSource);

  if (baseTokens.length !== headTokens.length) {
    const minLen = Math.min(baseTokens.length, headTokens.length);
    const firstDivergence = headTokens[minLen] ?? baseTokens[minLen];
    return {
      equal: false,
      reason: `token count differs (base=${baseTokens.length}, head=${headTokens.length})`,
      line: firstDivergence?.line ?? null,
    };
  }

  for (let i = 0; i < baseTokens.length; i++) {
    const b = baseTokens[i];
    const h = headTokens[i];
    if (b.kind !== h.kind || b.text !== h.text) {
      return {
        equal: false,
        reason: `token #${i} differs: base=${JSON.stringify(b.text)} (kind ${b.kind}) vs head=${JSON.stringify(h.text)} (kind ${h.kind})`,
        line: h.line,
      };
    }
  }

  return { equal: true };
}

function git(...args) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function getBaseRef(argv = process.argv, env = process.env) {
  const flag = argv.find((a) => a.startsWith("--base="));
  if (flag) return flag.slice("--base=".length);
  if (env.MIGRATION_BASE) return env.MIGRATION_BASE;
  return "origin/main";
}

function listChangedTestFiles(base) {
  const out = git("diff", "--name-only", `${base}...HEAD`).trim();
  if (!out) return [];
  return out
    .split(/\n/)
    .filter(
      (p) => p.endsWith(".test.ts") || p.endsWith(".test.tsx")
    )
    .filter((p) => !p.includes("/node_modules/"));
}

function readBaseSource(base, file) {
  try {
    return git("show", `${base}:${file}`);
  } catch {
    return null; // file did not exist at base — treat as added (no comparison)
  }
}

export function checkMigrationDiff({ base, files }) {
  const violations = [];
  for (const file of files) {
    const baseSource = readBaseSource(base, file);
    if (baseSource === null) continue; // newly added file
    let headSource;
    try {
      headSource = readFileSync(resolve(REPO_ROOT, file), "utf8");
    } catch {
      continue; // deleted file — out of scope
    }
    const result = compareSources(baseSource, headSource);
    if (!result.equal) {
      violations.push({
        file,
        line: result.line,
        reason: result.reason,
      });
    }
  }
  return { violations };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = getBaseRef();
  const files = listChangedTestFiles(base);
  if (files.length === 0) {
    console.log(
      `[check-aaa-migration-no-logic-edits] no test files changed between ${base} and HEAD; nothing to verify.`
    );
    process.exit(0);
  }

  const { violations } = checkMigrationDiff({ base, files });
  if (violations.length > 0) {
    console.error(
      `\n[check-aaa-migration-no-logic-edits] non-comment changes detected in ${violations.length} test file(s):\n`
    );
    for (const v of violations) {
      const where = v.line ? `${v.file}:${v.line}` : v.file;
      console.error(`  ${where} — ${v.reason}`);
    }
    console.error(
      `\nThe AAA migration prompt is "do NOT change test logic". This guard verifies it. ` +
        `If the diff is intentional (e.g., the migration also fixed a typo), revert the file ` +
        `and re-run the subagent with a tighter prompt.`
    );
    process.exit(1);
  }

  console.log(
    `[check-aaa-migration-no-logic-edits] verified ${files.length} test file(s) — comment-only diff against ${base}.`
  );
}
