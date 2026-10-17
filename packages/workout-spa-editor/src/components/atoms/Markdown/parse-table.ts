export type Align = "left" | "center" | "right" | null;

export type TableData = { align: Align[]; head: string[]; rows: string[][] };

const DELIMITER_CELL = /^:?-+:?$/;

/* Short rows are padded to the header width, so a wide header times many
   rows of "|" is a few KB of source but millions of cells. Past these caps
   a table is not built: too wide stays text, too many cells becomes code. */
export const MAX_TABLE_COLUMNS = 64;
export const MAX_TABLE_CELLS = 5000;

/** A GFM table starts on a row with a pipe followed by a `---|---` row. While
 * the delimiter row is still streaming the header stays a paragraph. */
export function isTableStart(lines: string[], i: number): boolean {
  const head = lines[i] ?? "";
  const next = lines[i + 1];
  return (
    head.includes("|") &&
    next !== undefined &&
    isDelimiterRow(next) &&
    splitRow(head).length <= MAX_TABLE_COLUMNS
  );
}

/* Checked cell by cell in code: one regex for the whole row needs adjacent
   `\s*` runs, which backtrack quadratically on a line of spaces. */
function isDelimiterRow(line: string): boolean {
  if (!line.includes("|") || !line.includes("-")) return false;
  return splitRow(line).every((cell) => DELIMITER_CELL.test(cell));
}

/** The table from its header row, or its raw source when it would hold more
 * than `MAX_TABLE_CELLS` cells once every row is padded to the header. */
export function readTable(
  lines: string[],
  i: number
): [TableData | string, number] {
  const head = splitRow(lines[i] ?? "");
  let end = i + 2;
  while (isRow(lines[end])) end++;
  if ((end - i - 1) * head.length > MAX_TABLE_CELLS)
    return [lines.slice(i, end).join("\n"), end];
  const align = splitRow(lines[i + 1] ?? "").map(toAlign);
  const rows = lines
    .slice(i + 2, end)
    .map((row) => fit(splitRow(row), head.length, ""));
  return [{ align: fit(align, head.length, null), head, rows }, end];
}

function isRow(line: string | undefined): line is string {
  return line !== undefined && line.trim() !== "" && line.includes("|");
}

function splitRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1);
  return row
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

function toAlign(cell: string): Align {
  const left = cell.startsWith(":");
  const right = cell.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  return left ? "left" : null;
}

function fit<T>(cells: T[], width: number, empty: T): T[] {
  const out = cells.slice(0, width);
  while (out.length < width) out.push(empty);
  return out;
}
