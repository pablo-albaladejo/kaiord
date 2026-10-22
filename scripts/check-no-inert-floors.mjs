#!/usr/bin/env node
/**
 * Mechanical guard: a runner that cannot run in CI may not carry a floor
 * (R-NoInertFloors).
 *
 * A threshold on a suite that cannot run in CI is a comparison that never
 * fires where merges are decided. It reads as a gate, reviews as a gate, and
 * gates nothing.
 *
 * Scope is deliberate on both sides. INERT means the runner cannot execute in
 * CI: it names the credential-bound loader `load-eval-model`, it imports any
 * module resolving under `packages/ai/src/evals/claude-cli/` (the live loader,
 * the CLI adapter, the spawner, the rate-limit guard or anything else there),
 * or it is itself located under `claude-cli/`. Import specifiers are resolved
 * against the importing file, so a sibling import `./x` from inside that
 * directory counts. The scan is recursive. A runner that needs neither a
 * credential nor the CLI is EXEMPT and may gate freely — a directory-wide ban
 * would forbid the keyless replay runner this project wants to gate on.
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
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";

const RUNNERS_DIR = "packages/ai/src/evals";
const CREDENTIAL_LOADER = "load-eval-model";
const LIVE_DIR = "claude-cli";
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
/** `from "x"`, `import "x"`, `import("x")`, `require("x")`. */
const SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(["'`])([^"'`]+)\1/g;

const isRunner = (path) => {
  const name = basename(path);
  return (
    name.startsWith("run-") &&
    name.endsWith(".ts") &&
    !name.endsWith(".test.ts")
  );
};

const isUnder = (path, dir) => path === dir || path.startsWith(dir + sep);

/** Local specifiers of `src`, resolved against the importing file. */
export const importTargets = (src, file) =>
  [...src.matchAll(SPECIFIER)]
    .map((match) => match[2])
    .filter((s) => s.startsWith(".") || isAbsolute(s))
    .map((s) => resolve(dirname(file), s));

/**
 * `file` and `root` are absolute; without them only the credential-bound
 * loader can be recognized.
 */
export const isInert = (src, file, root) => {
  if (src.includes(CREDENTIAL_LOADER)) return true;
  if (file === undefined || root === undefined) return false;
  const liveDir = join(root, LIVE_DIR);
  if (isUnder(resolve(file), liveDir)) return true;
  return importTargets(src, file).some((target) => isUnder(target, liveDir));
};

export const fileViolations = (src, file, root) => {
  if (!isInert(src, file, root)) return [];
  const label = root === undefined ? file : relative(root, file);
  const violations = [];
  const lineOf = (index) => src.slice(0, index).split("\n").length;

  for (const match of src.matchAll(EXIT_CALL)) {
    const argument = match[1];
    if (NUMERIC_LITERAL.test(argument)) continue;
    violations.push({
      kind: "computed-exit",
      file: label,
      line: lineOf(match.index),
      detail: `process.exit(${argument.trim()}) — an inert runner exits on a literal`,
    });
  }

  src.split("\n").forEach((text, i) => {
    if (text.trim().startsWith("*") || text.trim().startsWith("//")) return;
    if (!COMPARISON.test(text)) return;
    violations.push({
      kind: "score-comparison",
      file: label,
      line: i + 1,
      detail: text.trim().slice(0, 80),
    });
  });

  return violations;
};

const runnersUnder = (root) =>
  readdirSync(root, { recursive: true, encoding: "utf8" })
    .filter(isRunner)
    .map((path) => join(root, path))
    .sort();

export const runCheck = ({ runnersRoot }) => {
  let files;
  try {
    files = runnersUnder(runnersRoot);
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
        ...fileViolations(readFileSync(file, "utf8"), file, runnersRoot)
      );
    } catch (error) {
      violations.push({
        kind: "scan-failed",
        file: relative(runnersRoot, file),
        detail: error.message,
      });
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
      "inert floors: none — no runner that cannot run in CI gates on a score."
    );
    return;
  }
  for (const v of violations) {
    console.error(`  [${v.kind}] ${v.file ?? ""}:${v.line ?? 0} ${v.detail}`);
  }
  console.error(
    "\nA runner that names load-eval-model, imports from evals/claude-cli/ or\n" +
      "lives there cannot run in CI, so no score of its may decide its exit code."
  );
  process.exit(1);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
