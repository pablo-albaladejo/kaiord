import { describe, expect, it } from "vitest";

import { parseBlocks } from "./parse-blocks";
import { MAX_MARKDOWN_CHARS, parseMarkdown } from "./parse-markdown";
import { MAX_TABLE_CELLS, MAX_TABLE_COLUMNS } from "./parse-table";

const BUDGET_MS = 50;
const KB = 1024;
const MB = KB * KB;
const HEAP_BUDGET_MB = 32;
const RUNS = 3;
const WIDE = 10_000;
const MANY_ROWS = 5000;

const table = (columns: number, rows: number) =>
  [
    `|${" a |".repeat(columns)}`,
    `|${"---|".repeat(columns)}`,
    ...Array.from({ length: rows }, () => "|"),
  ].join("\n");

/* Fastest of a few runs (a cold JIT or a GC pause is not the parser's cost)
   and the largest heap growth seen. Padding 10 000 columns × 5 000 rows would
   be 50 M cells: seconds and hundreds of MB on every run. */
function measure(source: string) {
  let ms = Number.POSITIVE_INFINITY;
  let heap = 0;
  let blocks = parseBlocks("");
  for (let run = 0; run < RUNS; run++) {
    const heapBefore = process.memoryUsage().heapUsed;
    const started = performance.now();
    blocks = parseBlocks(source);
    ms = Math.min(ms, performance.now() - started);
    heap = Math.max(heap, process.memoryUsage().heapUsed - heapBefore);
  }
  return { blocks, ms, heapMb: heap / MB };
}

describe("parser size limits", () => {
  it("should keep a header wider than the column cap as text, fast and small", () => {
    // Arrange
    const source = table(WIDE, MANY_ROWS);

    // Act
    const { blocks, ms, heapMb } = measure(source);

    // Assert
    expect(blocks.some((b) => b.kind === "table")).toBe(false);
    expect(ms).toBeLessThan(BUDGET_MS);
    expect(heapMb).toBeLessThan(HEAP_BUDGET_MB);
  });

  it("should render a table past the cell cap as code instead of padding it", () => {
    // Arrange
    const source = table(MAX_TABLE_COLUMNS, MANY_ROWS);

    // Act
    const { blocks, ms, heapMb } = measure(source);

    // Assert
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.kind).toBe("code");
    expect(ms).toBeLessThan(BUDGET_MS);
    expect(heapMb).toBeLessThan(HEAP_BUDGET_MB);
  });

  it("should still build a table right at the caps", () => {
    // Arrange
    const rows = MAX_TABLE_CELLS / MAX_TABLE_COLUMNS - 1;
    const source = table(MAX_TABLE_COLUMNS, Math.floor(rows));

    // Act
    const [block] = parseBlocks(source);

    // Assert
    expect(block?.kind).toBe("table");
  });

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
