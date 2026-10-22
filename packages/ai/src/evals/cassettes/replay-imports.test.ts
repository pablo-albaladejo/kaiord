import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const CASSETTES_DIR = import.meta.dirname;
const EVALS_DIR = resolve(CASSETTES_DIR, "..");
const CLAUDE_CLI_DIR = join(EVALS_DIR, "claude-cli");
const REPO_ROOT = resolve(EVALS_DIR, "..", "..", "..", "..");

// The replay path reaches the runtime, prompts and scorers; far fewer means
// the walk stopped early and the pin below would hold vacuously.
const MIN_REACHED_MODULES = 10;

/**
 * The classic compiler API. `@kaiord/ai` builds with TypeScript 7, whose
 * package exposes no parser, so the repo root's TypeScript 6 is loaded.
 */
type Node = { kind: number; getStart(): number; getText(): string };
type Ts = {
  createSourceFile(
    name: string,
    text: string,
    target: number,
    setParents: boolean
  ): Node;
  forEachChild(node: Node, visit: (child: Node) => void): void;
  ScriptTarget: { Latest: number };
  isImportDeclaration(n: Node): n is Node & { moduleSpecifier: Node };
  isExportDeclaration(n: Node): n is Node & { moduleSpecifier?: Node };
  isExternalModuleReference(n: Node): n is Node & { expression: Node };
  isCallExpression(
    n: Node
  ): n is Node & { expression: Node; arguments: Array<Node> };
  isIdentifier(n: Node): n is Node & { text: string };
  isStringLiteralLike(n: Node): n is Node & { text: string };
  SyntaxKind: { ImportKeyword: number };
};
const ts = createRequire(join(REPO_ROOT, "package.json"))("typescript") as Ts;

type Scan = { specifiers: Array<string>; dynamic: Array<string> };

const isLoader = (call: { expression: Node }): boolean =>
  call.expression.kind === ts.SyntaxKind.ImportKeyword ||
  (ts.isIdentifier(call.expression) && call.expression.text === "require");

/** Static and literal dynamic specifiers, plus every non-literal loader call. */
const scanSource = (src: string, file: string): Scan => {
  const scan: Scan = { specifiers: [], dynamic: [] };
  const literal = (node: Node | undefined) => {
    if (node && ts.isStringLiteralLike(node)) scan.specifiers.push(node.text);
  };
  const visit = (node: Node): void => {
    if (ts.isImportDeclaration(node)) literal(node.moduleSpecifier);
    else if (ts.isExportDeclaration(node)) literal(node.moduleSpecifier);
    else if (ts.isExternalModuleReference(node)) literal(node.expression);
    else if (ts.isCallExpression(node) && isLoader(node)) {
      const [argument] = node.arguments;
      if (argument && ts.isStringLiteralLike(argument)) literal(argument);
      else scan.dynamic.push(`${relative(EVALS_DIR, file)}: ${node.getText()}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true));
  return scan;
};

const localTargets = (scan: Scan, file: string): Array<string> =>
  scan.specifiers
    .filter((s) => s.startsWith("."))
    .map((s) => resolve(dirname(file), s));

const asSourceFile = (path: string): string | undefined =>
  [path, `${path}.ts`, join(path, "index.ts")].find(
    (p) => p.endsWith(".ts") && existsSync(p)
  );

const isUnderClaudeCli = (path: string): boolean =>
  path === CLAUDE_CLI_DIR || path.startsWith(CLAUDE_CLI_DIR + sep);

/** Every non-test module under `cassettes/`, recursively. */
const cassetteEntries = (): Array<string> =>
  readdirSync(CASSETTES_DIR, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .map((f) => join(CASSETTES_DIR, f));

/** Every module the entries reach, transitively, through local imports. */
const reachableFrom = (entries: Array<string>) => {
  const seen = new Set<string>();
  const offending: Array<string> = [];
  const dynamic: Array<string> = [];
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const scan = scanSource(readFileSync(file, "utf8"), file);
    dynamic.push(...scan.dynamic);
    for (const target of localTargets(scan, file)) {
      if (isUnderClaudeCli(target)) offending.push(relative(EVALS_DIR, file));
      const source = asSourceFile(target);
      if (source) queue.push(source);
    }
  }
  return { seen, offending, dynamic };
};

const RUNNER = join(CASSETTES_DIR, "replay-runner.ts");

describe("replay runner imports", () => {
  it("should import nothing from evals/claude-cli/, transitively, from any cassettes module", () => {
    // Arrange
    const entries = cassetteEntries();

    // Act
    const { seen, offending, dynamic } = reachableFrom(entries);

    // Assert
    expect(entries).toContain(RUNNER);
    expect(seen.size).toBeGreaterThan(MIN_REACHED_MODULES);
    expect(offending).toEqual([]);
    expect(dynamic).toEqual([]);
  });

  it.each([
    ['import { x } from "../claude-cli/spawn-claude";'],
    ['export { x } from "../claude-cli/spawn-claude";'],
    ['const m = await import("../claude-cli/spawn-claude");'],
    ["const m = await import(`../claude-cli/spawn-claude`);"],
    ['const m = require("../claude-cli/spawn-claude");'],
  ])("should resolve %s under claude-cli", (src) => {
    // Arrange

    // Act
    const targets = localTargets(scanSource(src, RUNNER), RUNNER);

    // Assert
    expect(targets.some(isUnderClaudeCli)).toBe(true);
  });

  it.each([
    ["a template literal", "const m = await import(`../claude-cli/${name}`);"],
    ["a variable", 'const p = "../claude-cli/x"; const m = await import(p);'],
    ["a computed require", "const m = require(dir + '/spawn');"],
  ])(
    "should flag a dynamic import of %s, which cannot be resolved",
    (_label, src) => {
      // Arrange

      // Act
      const { dynamic } = scanSource(src, RUNNER);

      // Assert
      expect(dynamic).toHaveLength(1);
    }
  );

  it("should treat a sibling import inside claude-cli as under it", () => {
    // Arrange
    const file = join(CLAUDE_CLI_DIR, "runner.ts");

    // Act
    const targets = localTargets(
      scanSource('import x from "./x";', file),
      file
    );

    // Assert
    expect(targets.every(isUnderClaudeCli)).toBe(true);
  });
});
