#!/usr/bin/env node
/**
 * Mechanical guard: a runner that cannot execute may not carry a floor
 * (R-NoInertFloors).
 *
 * A threshold on a suite that needs a credential this project does not have is
 * a comparison that can never fire. It reads as a gate, reviews as a gate, and
 * gates nothing.
 *
 * Scope is deliberate on both sides. INERT means the runner takes its model
 * from `load-eval-model`, which throws without a provider key. A runner that
 * needs no credential is EXEMPT and may gate freely — a directory-wide ban
 * would forbid the keyless gating runner this project should eventually want.
 *
 * Two rules, because one is evadable. The obvious grep for a comparison inside
 * `process.exit` is defeated by binding it first:
 *
 *   const ok = rate >= 0.9;
 *   process.exit(ok ? 0 : 1);   // <- no comparison in sight
 *
 * So: (1) in an inert runner `process.exit` takes a numeric literal, and
 * (2) no comparison may be applied to a score-shaped name anywhere in it.
 * Rule 2 is a name-based approximation and says so; it is the half that
 * survives the variable binding.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0.
 *   (default)    Print a human-readable report; exit non-zero on any.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RUNNERS_DIR = "packages/ai/src/evals";
const CREDENTIAL_LOADER = "load-eval-model";
const SCORE_NAMES =
  "rate|passrate|passratepercent|score|passed|threshold|floor|ratio|accuracy";
// Whitespace on BOTH sides is required, and that is load-bearing: it is what
// separates a comparison (`rate >= 0.9`, as prettier writes it) from an arrow
// (`(r) => passed`) and from a generic (`Array<Score>`), which carry the same
// characters and mean nothing of the sort.
const COMPARISON = new RegExp(
  `(?:\\b(?:${SCORE_NAMES})\\w*\\s+(?:>=|<=|>|<)\\s)` +
    `|(?:\\s(?:>=|<=|>|<)\\s+\\w*(?:${SCORE_NAMES})\\b)`,
  "i"
);
const EXIT_CALL = /process\.exit\(([^)]*)\)/g;
const NUMERIC_LITERAL = /^\s*\d+\s*$/;

const isRunner = (f) => f.startsWith("run-") && f.endsWith(".ts");

export const isInert = (src) => src.includes(CREDENTIAL_LOADER);

export const fileViolations = (src, file) => {
  if (!isInert(src)) return [];
  const violations = [];
  const lineOf = (index) => src.slice(0, index).split("\n").length;

  for (const match of src.matchAll(EXIT_CALL)) {
    const argument = match[1];
    if (NUMERIC_LITERAL.test(argument)) continue;
    violations.push({
      kind: "computed-exit",
      file,
      line: lineOf(match.index),
      detail: `process.exit(${argument.trim()}) — an inert runner exits on a literal`,
    });
  }

  src.split("\n").forEach((text, i) => {
    if (text.trim().startsWith("*") || text.trim().startsWith("//")) return;
    if (!COMPARISON.test(text)) return;
    violations.push({
      kind: "score-comparison",
      file,
      line: i + 1,
      detail: text.trim().slice(0, 80),
    });
  });

  return violations;
};

export const runCheck = ({ runnersRoot }) => {
  let files;
  try {
    files = readdirSync(runnersRoot).filter(isRunner);
  } catch (error) {
    return [
      {
        kind: "scan-failed",
        detail: `could not read ${runnersRoot}: ${error.message}`,
      },
    ];
  }
  if (files.length === 0) {
    return [{ kind: "scan-empty", detail: `no runners under ${runnersRoot}` }];
  }

  const violations = [];
  for (const file of files) {
    try {
      violations.push(
        ...fileViolations(readFileSync(join(runnersRoot, file), "utf8"), file)
      );
    } catch (error) {
      violations.push({ kind: "scan-failed", file, detail: error.message });
    }
  }
  return violations;
};

const main = () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const violations = runCheck({ runnersRoot: join(root, RUNNERS_DIR) });
  if (process.argv.includes("--dry-run")) {
    console.log(JSON.stringify(violations, null, 2));
    return;
  }
  if (violations.length === 0) {
    console.log(
      "inert floors: none — no credential-bound runner gates on a score."
    );
    return;
  }
  for (const v of violations) {
    console.error(`  [${v.kind}] ${v.file ?? ""}:${v.line ?? 0} ${v.detail}`);
  }
  console.error(
    "\nA runner whose model comes from load-eval-model cannot execute here,\n" +
      "so no score of its may decide its exit code."
  );
  process.exit(1);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
