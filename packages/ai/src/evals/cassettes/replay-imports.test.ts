import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const EVALS_DIR = resolve(import.meta.dirname, "..");
const CLAUDE_CLI_DIR = join(EVALS_DIR, "claude-cli");
const ENTRIES = ["replay-runner.ts", "parser-replay-suite.ts"].map((f) =>
  join(import.meta.dirname, f)
);

// The replay path reaches the runtime, prompts and scorers; far fewer means
// the walk stopped early and the pin below would hold vacuously.
const MIN_REACHED_MODULES = 10;

const SPECIFIER = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;

/** Relative specifiers resolved against the importing file, as Node would. */
const localImportsOf = (src: string, file: string): Array<string> =>
  [...src.matchAll(SPECIFIER)]
    .map((m) => m[1]!)
    .filter((s) => s.startsWith("."))
    .map((s) => resolve(dirname(file), s));

const asSourceFile = (path: string): string | undefined =>
  [path, `${path}.ts`, join(path, "index.ts")].find(
    (p) => p.endsWith(".ts") && existsSync(p)
  );

const isUnderClaudeCli = (path: string): boolean =>
  path === CLAUDE_CLI_DIR || path.startsWith(CLAUDE_CLI_DIR + sep);

/** Every module the replay entries reach, transitively, through local imports. */
const reachableFrom = (entries: Array<string>) => {
  const seen = new Set<string>();
  const offending: Array<string> = [];
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const target of localImportsOf(readFileSync(file, "utf8"), file)) {
      if (isUnderClaudeCli(target)) offending.push(relative(EVALS_DIR, file));
      const source = asSourceFile(target);
      if (source) queue.push(source);
    }
  }
  return { seen, offending };
};

describe("replay runner imports", () => {
  it("should import nothing from evals/claude-cli/, transitively", () => {
    // Arrange

    // Act
    const { seen, offending } = reachableFrom(ENTRIES);

    // Assert
    expect(seen.size).toBeGreaterThan(MIN_REACHED_MODULES);
    expect(offending).toEqual([]);
  });

  it("should detect a claude-cli import, so the pin above cannot pass vacuously", () => {
    // Arrange
    const file = join(import.meta.dirname, "replay-runner.ts");
    const src = 'import { spawnClaude } from "../claude-cli/spawn-claude";';

    // Act
    const targets = localImportsOf(src, file);

    // Assert
    expect(targets.some(isUnderClaudeCli)).toBe(true);
  });

  it("should treat a sibling import inside claude-cli as under it", () => {
    // Arrange
    const file = join(CLAUDE_CLI_DIR, "runner.ts");

    // Act
    const targets = localImportsOf('import x from "./x";', file);

    // Assert
    expect(targets.every(isUnderClaudeCli)).toBe(true);
  });
});
