import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Markdown } from "./Markdown";
import { MAX_MARKDOWN_CHARS, parseMarkdown } from "./parse-markdown";
import {
  MAX_MESSAGE_TABLE_CELLS,
  MAX_TABLE_COLUMNS,
  MAX_TABLE_ROWS,
} from "./parse-table";

const BUDGET_MS = 50;
const KB = 1024;
const MB = KB * KB;
const HEAP_BUDGET_MB = 32;
const RUNS = 3;
const WIDE = 10_000;
const MANY_ROWS = 5000;
const SOME_COLUMNS = 100;
const SOME_ROWS = 2000;

const table = (columns: number, rows: number) =>
  [
    `|${" a |".repeat(columns)}`,
    `|${"---|".repeat(columns)}`,
    ...Array.from({ length: rows }, () => "|"),
  ].join("\n");

/* Fastest of a few runs (a cold JIT or a GC pause is not the parser's cost)
   and the largest heap growth seen. Padding every "|" row to a wide header is
   hundreds of thousands of cells: slow and large on every run. */
function measure(source: string) {
  let ms = Number.POSITIVE_INFINITY;
  let heap = 0;
  let blocks = parseMarkdown("");
  for (let run = 0; run < RUNS; run++) {
    const heapBefore = process.memoryUsage().heapUsed;
    const started = performance.now();
    blocks = parseMarkdown(source);
    ms = Math.min(ms, performance.now() - started);
    heap = Math.max(heap, process.memoryUsage().heapUsed - heapBefore);
  }
  return { blocks, ms, heapMb: heap / MB };
}

const renderedCells = (source: string) =>
  render(<Markdown source={source} />).container.querySelectorAll("td, th")
    .length;

describe("parser size limits", () => {
  it.each([
    ["10 000 columns × 5 000 rows", table(WIDE, MANY_ROWS)],
    ["100 columns × 2 000 rows", table(SOME_COLUMNS, SOME_ROWS)],
    ["30 columns × 2 000 rows", table(MAX_TABLE_COLUMNS, SOME_ROWS)],
    ["30 columns × 201 rows", table(MAX_TABLE_COLUMNS, MAX_TABLE_ROWS + 1)],
  ])("should build no cells for %s, fast and small", (_name, source) => {
    // Arrange
    const kinds = new Set(["paragraph", "code"]);

    // Act
    const { blocks, ms, heapMb } = measure(source);

    // Assert
    expect(blocks.every((b) => kinds.has(b.kind))).toBe(true);
    expect(renderedCells(source)).toBe(0);
    expect(ms).toBeLessThan(BUDGET_MS);
    expect(heapMb).toBeLessThan(HEAP_BUDGET_MB);
  });

  it("should render a short row's cells only, not pad it to the header", () => {
    // Arrange
    const source = table(MAX_TABLE_COLUMNS, MAX_TABLE_ROWS);

    // Act
    const cells = renderedCells(source);

    // Assert
    expect(cells).toBe(MAX_TABLE_COLUMNS + MAX_TABLE_ROWS);
  });

  it.each([
    ["|", "|"],
    ["|*a*", "|*a*"],
  ])(
    "should share one cell budget across many tables with %s rows",
    (_name, row) => {
      // Arrange
      const one = table(MAX_TABLE_COLUMNS, MAX_TABLE_ROWS).replace(
        /\n\|$/gm,
        `\n${row}`
      );
      // As many as fit under the input cap: ~100 KB of tables.
      const count = Math.floor(MAX_MARKDOWN_CHARS / (one.length + 2));
      const source = Array.from({ length: count }, () => one).join("\n\n");

      // Act
      const { blocks, ms } = measure(source);
      const cells = renderedCells(source);

      // Assert
      expect(source.length).toBeLessThanOrEqual(MAX_MARKDOWN_CHARS);
      expect(blocks.some((b) => b.kind === "code")).toBe(true);
      expect(cells).toBeLessThanOrEqual(MAX_MESSAGE_TABLE_CELLS);
      expect(ms).toBeLessThan(BUDGET_MS);
    }
  );

  it("should leave input past the length cap as plain text", () => {
    // Arrange
    const head = `${"**a** ".repeat(MAX_MARKDOWN_CHARS / "**a** ".length)}\n`;
    const source = `${head}tail **not bold**`;

    // Act
    const blocks = parseMarkdown(source);

    // Assert
    expect(blocks.at(-1)).toEqual({ kind: "text", text: "tail **not bold**" });
    expect(blocks.at(0)?.kind).toBe("paragraph");
  });
});
