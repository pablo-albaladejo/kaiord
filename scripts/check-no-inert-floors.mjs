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
 * CI. It is decided over the TypeScript AST and the runner's transitive
 * closure of local imports: a runner is inert when it, or any local module it
 * reaches, names the credential-bound loader `load-eval-model`, holds a
 * string literal resolving under `packages/ai/src/evals/claude-cli/` (every
 * string literal is a candidate specifier, so a path kept in a constant
 * counts), lives under `claude-cli/`, or uses a loader the walk cannot follow
 * (`createRequire`, `import()`/`require()` of anything but a plain string,
 * `x.require`): an unknowable target fails closed. Runners are every
 * `run-*.{ts,mts,cts}` under the evals tree, recursively, tests excluded. A
 * runner that needs neither a credential nor the CLI is EXEMPT and may gate
 * freely — a directory-wide ban would forbid the keyless replay runner this
 * project wants to gate on.
 *
 * Two rules, because one is evadable. The obvious check for a comparison
 * inside `process.exit` is defeated by binding it first:
 *
 *   const ok = rate >= 0.9;
 *   process.exit(ok ? 0 : 1);   // <- no comparison in sight
 *
 * So: (1) in an inert runner `process.exit(x)` and `process.exitCode = x`
 * take a numeric literal, and (2) no `<`, `<=`, `>`, `>=` may have a
 * score-shaped identifier on either side anywhere in it. Rule 2 is a
 * name-based approximation and says so; it is the half that survives the
 * variable binding. Comments are not code, so they never match.
 *
 * Modes:
 *   --dry-run    Emit violations as JSON on stdout; exit 0.
 *   (default)    Print a human-readable report; exit non-zero on any.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
import ts from "typescript";

const RUNNERS_DIR = "packages/ai/src/evals";
const CREDENTIAL_LOADER = "load-eval-model";
const LIVE_DIR = "claude-cli";
const SCORE_NAMES =
  "rate|passrate|passratepercent|score|passed|threshold|floor|ratio|accuracy";
/** An identifier that starts or ends with a score name: `passRate`, `minScore`. */
const SCORE_WORD = new RegExp(
  `^(?:(?:${SCORE_NAMES})\\w*|\\w*(?:${SCORE_NAMES}))$`,
  "i"
);
const RUNNER_NAME = /^run-.+\.(?:ts|mts|cts)$/;
const TEST_NAME = /\.(?:test|spec)\.(?:ts|mts|cts)$/;
const SOURCE_EXTENSIONS = [
  ".ts",
  ".mts",
  ".cts",
  ".tsx",
  ".mjs",
  ".js",
  ".cjs",
];
const COMPARISON_KINDS = new Set([
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
]);
const LOADER_NAMES = new Set(["require", "createRequire"]);

const isRunner = (path) => {
  const name = basename(path);
  return RUNNER_NAME.test(name) && !TEST_NAME.test(name);
};

const isUnder = (path, dir) => path === dir || path.startsWith(dir + sep);

const parse = (src, file) =>
  ts.createSourceFile(file ?? "module.ts", src, ts.ScriptTarget.Latest, true);

const walk = (node, visit) => {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
};

const nameOf = (node) =>
  ts.isIdentifier(node) || ts.isStringLiteralLike(node) ? node.text : "";

/**
 * A loader the walk cannot follow: `import()` or `require()` of anything but
 * a plain string, `createRequire` in any form, `x.require`, `x["require"]`.
 * Its target is unknowable, so the module counts as inert: it fails closed.
 */
const isOpaqueLoader = (node) => {
  if (ts.isIdentifier(node)) return node.text === "createRequire";
  if (ts.isPropertyAccessExpression(node)) {
    return LOADER_NAMES.has(nameOf(node.name));
  }
  if (ts.isElementAccessExpression(node)) {
    return LOADER_NAMES.has(nameOf(node.argumentExpression));
  }
  if (!ts.isCallExpression(node)) return false;
  const callee = node.expression;
  const isLoader =
    callee.kind === ts.SyntaxKind.ImportKeyword ||
    (ts.isIdentifier(callee) && callee.text === "require");
  const [argument] = node.arguments;
  return isLoader && !(argument && ts.isStringLiteralLike(argument));
};

/**
 * Every string literal is a candidate specifier, as in the replay lane's
 * import pin: a path held in a constant is caught wherever it appears.
 */
export const scanModule = (src, file) => {
  const scan = { specifiers: [], opaque: [] };
  walk(parse(src, file), (node) => {
    if (ts.isStringLiteralLike(node)) scan.specifiers.push(node.text);
    if (isOpaqueLoader(node)) scan.opaque.push(node.getText().slice(0, 80));
  });
  return scan;
};

/** Local specifiers of `src`, resolved against the importing file. */
export const importTargets = (src, file) =>
  scanModule(src, file)
    .specifiers.filter((s) => s.startsWith(".") || isAbsolute(s))
    .map((s) => resolve(dirname(file), s));

/**
 * Every code file a local target could resolve to: TypeScript, `.js` written
 * for `.ts` included, and plain `.mjs`/`.js`/`.cjs` helpers. All of them are
 * followed, not the first found, so an ambiguous stem (`helpers.js` beside
 * `helpers.ts`) fails closed instead of hiding one of the two.
 */
const sourceFiles = (target) => {
  const stem = target.replace(/\.[cm]?js$/, "");
  const candidates = [
    target,
    ...SOURCE_EXTENSIONS.map((ext) => stem + ext),
    ...SOURCE_EXTENSIONS.map((ext) => join(target, `index${ext}`)),
  ];
  return [...new Set(candidates)].filter(
    (p) => SOURCE_EXTENSIONS.some((ext) => p.endsWith(ext)) && existsSync(p)
  );
};

/** Why one module makes its importer inert, or undefined. */
const moduleReason = (src, file, liveDir) => {
  const scan = scanModule(src, file);
  if (scan.specifiers.some((s) => s.includes(CREDENTIAL_LOADER))) {
    return `names ${CREDENTIAL_LOADER}`;
  }
  if (scan.opaque.length > 0) return `opaque loader ${scan.opaque[0]}`;
  if (liveDir === undefined) return undefined;
  if (isUnder(resolve(file), liveDir)) return `lives under ${LIVE_DIR}/`;
  const live = importTargets(src, file).find((t) => isUnder(t, liveDir));
  return live ? `reaches ${LIVE_DIR}/` : undefined;
};

/**
 * Why the runner is inert, following local imports transitively, or
 * undefined. `file` and `root` are absolute; without them only the runner's
 * own text is judged.
 */
export const inertReason = (src, file, root) => {
  const liveDir = root === undefined ? undefined : join(root, LIVE_DIR);
  const seen = new Set();
  const queue = [{ path: file, text: src }];
  while (queue.length > 0) {
    const { path, text } = queue.pop();
    if (seen.has(path)) continue;
    seen.add(path);
    const reason = moduleReason(text, path, liveDir);
    if (reason) return path === file ? reason : `${reason} via ${path}`;
    if (root === undefined) continue;
    for (const target of importTargets(text, path)) {
      for (const next of sourceFiles(target)) {
        if (!seen.has(next)) {
          queue.push({ path: next, text: readFileSync(next, "utf8") });
        }
      }
    }
  }
  return undefined;
};

export const isInert = (src, file, root) =>
  inertReason(src, file, root) !== undefined;

const isProcessMember = (node, member) =>
  (ts.isPropertyAccessExpression(node) &&
    nameOf(node.expression) === "process" &&
    node.name.text === member) ||
  (ts.isElementAccessExpression(node) &&
    nameOf(node.expression) === "process" &&
    nameOf(node.argumentExpression) === member);

const isNumericLiteral = (node) =>
  node !== undefined && ts.isNumericLiteral(node);

/** `process.exit(x)` or `process.exitCode = x` (any assignment) with `x`. */
const exitValue = (node) => {
  if (ts.isCallExpression(node) && isProcessMember(node.expression, "exit")) {
    return { found: true, value: node.arguments[0] };
  }
  const isAssignment =
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment;
  if (isAssignment && isProcessMember(node.left, "exitCode")) {
    return { found: true, value: node.right };
  }
  return { found: false };
};

const isScoreShaped = (node) =>
  (node.getText().match(/[A-Za-z_$][\w$]*/g) ?? []).some((w) =>
    SCORE_WORD.test(w)
  );

export const fileViolations = (src, file, root) => {
  if (!isInert(src, file, root)) return [];
  const label = root === undefined ? file : relative(root, file);
  const source = parse(src, file);
  const lineOf = (node) =>
    source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const violations = [];
  walk(source, (node) => {
    const exit = exitValue(node);
    if (exit.found && !isNumericLiteral(exit.value)) {
      violations.push({
        kind: "computed-exit",
        file: label,
        line: lineOf(node),
        detail: `${node.getText().slice(0, 80)} — an inert runner exits on a literal`,
      });
    }
    const isComparison =
      ts.isBinaryExpression(node) &&
      COMPARISON_KINDS.has(node.operatorToken.kind);
    if (
      isComparison &&
      (isScoreShaped(node.left) || isScoreShaped(node.right))
    ) {
      violations.push({
        kind: "score-comparison",
        file: label,
        line: lineOf(node),
        detail: node.getText().slice(0, 80),
      });
    }
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
    "\nA runner that names load-eval-model, reaches evals/claude-cli/ (directly,\n" +
      "through a helper, or through a loader the scan cannot follow) or lives\n" +
      "there cannot run in CI, so no score of its may decide its exit code."
  );
  process.exit(1);
};

if (import.meta.url === `file://${process.argv[1]}`) main();
