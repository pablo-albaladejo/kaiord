import { describe, expect, it } from "vitest";

import { type Block, parseBlocks } from "./parse-blocks";
import { parseInline } from "./parse-inline";

const N = 10_000;
const BUDGET_MS = 50;
const RUNS = 3;

/* Fastest of a few runs: a GC pause on a loaded machine is not the parser's
   cost, while a super-linear pattern stays seconds slow on every run. */
function fastestRunMs(source: string): number {
  let best = Number.POSITIVE_INFINITY;
  for (let run = 0; run < RUNS; run++) {
    const started = performance.now();
    parseAll(source);
    best = Math.min(best, performance.now() - started);
  }
  return best;
}

/* What the renderer parses: blocks, then the inline text of each one. */
function parseAll(source: string): void {
  const walk = (blocks: Block[]): void => {
    for (const b of blocks) {
      if (b.kind === "paragraph" || b.kind === "heading") parseInline(b.text);
      if (b.kind === "quote") walk(b.blocks);
      if (b.kind === "list") b.items.forEach(walk);
      if (b.kind === "table") [...b.head, ...b.rows.flat()].map(parseInline);
    }
  };
  walk(parseBlocks(source));
}

const ATTACKS: Record<string, string> = {
  "heading padded with spaces": `# a${" ".repeat(N)}x`,
  "heading of closing hashes": `# ${"#".repeat(N)}x`,
  "leading spaces": `${" ".repeat(N)}x`,
  "spaced rule": `-${" -".repeat(N)}`,
  "spaced rule broken at the end": `-${" -".repeat(N)}x`,
  "delimiter row of spaces": `| a |\n${" ".repeat(N)}x`,
  "delimiter row of cells": `| a |\n|${"-|".repeat(N)}x`,
  "unclosed strong": `**${"a".repeat(N)}`,
  "underscore strong never closing": " __a__b".repeat(N / " __a__b".length),
  "unclosed link destination": `[a](${"b".repeat(N)}`,
  "link destination then spaces": `[a](b${" ".repeat(N)}x`,
  "nested parens in destination": `[a](${"(b".repeat(N / 2)}`,
  "bare URL of dots": `http://${".".repeat(N)}`,
  "bare URL of parens": `http://${"(".repeat(N)}`,
  "alternating em": "*a".repeat(N / 2),
  "alternating underscore": "_a".repeat(N / 2),
  backticks: "`".repeat(N),
  backslashes: "\\".repeat(N),
  "quote markers": ">".repeat(N),
  "list markers": "- ".repeat(N),
  "list item ending in U+2028": `-${" ".repeat(N)}a\u2028`,
  "heading ending in U+2029": `# ${" ".repeat(N)}a\u2029`,
  "quote ending in U+2028": `>${" ".repeat(N)}a\u2028`,
  "ordered markers": "1. ".repeat(N / "1. ".length),
};

describe("parser cost on hostile input (N=10000)", () => {
  it.each(Object.entries(ATTACKS))(
    `should parse %s in under ${BUDGET_MS} ms`,
    (_name, source) => {
      // Arrange
      const budget = BUDGET_MS;

      // Act
      const elapsed = fastestRunMs(source);

      // Assert
      expect(elapsed).toBeLessThan(budget);
    }
  );
});
