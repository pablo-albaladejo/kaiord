import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
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
type Node = { kind: number; getText(): string };
type Ts = {
  createSourceFile(
    name: string,
    text: string,
    target: number,
    setParents: boolean
  ): Node;
  forEachChild(node: Node, visit: (child: Node) => void): void;
  ScriptTarget: { Latest: number };
  isCallExpression(
    n: Node
  ): n is Node & { expression: Node; arguments: Array<Node> };
  isIdentifier(n: Node): n is Node & { text: string };
  isStringLiteralLike(n: Node): n is Node & { text: string };
  isPropertyAccessExpression(n: Node): n is Node & { name: Node };
  isElementAccessExpression(n: Node): n is Node & { argumentExpression: Node };
  SyntaxKind: { ImportKeyword: number };
};

const classicCompiler = (candidate: unknown): Ts => {
  if (typeof (candidate as Partial<Ts>)?.createSourceFile !== "function") {
    throw new Error(
      "the repo root's typescript has no createSourceFile: the claude-cli " +
        "import pin needs the classic compiler API, so port it to the new one"
    );
  }
  return candidate as Ts;
};

const ts = classicCompiler(
  createRequire(join(REPO_ROOT, "package.json"))("typescript")
);

/**
 * `specifiers`: every string literal in the module, so a path to claude-cli
 * is caught wherever it appears. `dynamic`: every loader the walk cannot
 * follow: `import()`/`require()` of a non-literal, `createRequire`, and any
 * `x.require` / `x["require"]`.
 */
type Scan = { specifiers: Array<string>; dynamic: Array<string> };

const LOADER_NAMES = new Set(["require", "createRequire"]);

const isLoaderCallee = (callee: Node): boolean =>
  callee.kind === ts.SyntaxKind.ImportKeyword ||
  (ts.isIdentifier(callee) && callee.text === "require");

const nameOf = (node: Node): string | undefined =>
  ts.isIdentifier(node) || ts.isStringLiteralLike(node) ? node.text : undefined;

const isOpaqueLoader = (node: Node): boolean => {
  if (ts.isIdentifier(node)) return node.text === "createRequire";
  if (ts.isPropertyAccessExpression(node)) {
    return LOADER_NAMES.has(nameOf(node.name) ?? "");
  }
  if (ts.isElementAccessExpression(node)) {
    return LOADER_NAMES.has(nameOf(node.argumentExpression) ?? "");
  }
  if (!ts.isCallExpression(node) || !isLoaderCallee(node.expression)) {
    return false;
  }
  const [argument] = node.arguments;
  return !(argument && ts.isStringLiteralLike(argument));
};

const scanSource = (src: string, file: string): Scan => {
  const scan: Scan = { specifiers: [], dynamic: [] };
  const visit = (node: Node): void => {
    if (ts.isStringLiteralLike(node)) scan.specifiers.push(node.text);
    if (isOpaqueLoader(node)) {
      scan.dynamic.push(`${relative(EVALS_DIR, file)}: ${node.getText()}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true));
  return scan;
};

/** Relative and absolute path literals, resolved against the module. */
const localTargets = (scan: Scan, file: string): Array<string> =>
  scan.specifiers
    .filter((s) => s.startsWith(".") || isAbsolute(s))
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
    ["a variable", "const p = name; const m = await import(p);"],
    ["a computed require", "const m = require(dir + '/spawn');"],
    ["createRequire", 'import { createRequire } from "node:module";'],
    ["createRequire(...)(...)", "createRequire(import.meta.url)(name);"],
    ["module.require", "module.require(name);"],
    ['module["require"]', 'module["require"](name);'],
  ])("should flag a loader the walk cannot follow: %s", (_label, src) => {
    // Arrange

    // Act
    const { dynamic } = scanSource(src, RUNNER);

    // Assert
    expect(dynamic).toHaveLength(1);
  });

  it.each([
    ["a string constant", 'const p = "../claude-cli/spawn-claude";'],
    ["an absolute path", `import x from "${join(CLAUDE_CLI_DIR, "x.ts")}";`],
  ])("should resolve %s under claude-cli", (_label, src) => {
    // Arrange

    // Act
    const targets = localTargets(scanSource(src, RUNNER), RUNNER);

    // Assert
    expect(targets.some(isUnderClaudeCli)).toBe(true);
  });

  it("should fail readably when the root typescript has no classic parser", () => {
    // Arrange
    const typescript7 = { version: "7.0.2" };

    // Act
    const act = () => classicCompiler(typescript7);

    // Assert
    expect(act).toThrow("has no createSourceFile");
  });

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
