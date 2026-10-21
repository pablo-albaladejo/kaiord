export type Align = "left" | "center" | "right" | null;

export type TableData = { align: Align[]; head: string[]; rows: string[][] };

const DELIMITER_CELL = /^:?-+:?$/;

/* Rows are never padded: a short row renders its own cells and the last one
   spans the rest, so cells are bounded by the source bytes. On top of that a
   table is not built past these caps (too wide stays text, too long becomes
   code), and all tables of one message share one cell budget: once spent,
   the remaining tables render as code. */
export const MAX_TABLE_COLUMNS = 30;
export const MAX_TABLE_ROWS = 200;
export const MAX_MESSAGE_TABLE_CELLS = 5000;

/** Cells still available to the tables of the message being parsed. */
export type CellBudget = { left: number };

export const newCellBudget = (): CellBudget => ({
  left: MAX_MESSAGE_TABLE_CELLS,
});

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

/** The table from its header row, or its raw source when it has more than
 * `MAX_TABLE_ROWS` body rows or more cells than the message has left. */
export function readTable(
  lines: string[],
  i: number,
  budget: CellBudget
): [TableData | string, number] {
  const head = splitRow(lines[i] ?? "");
  let end = i + 2;
  while (isRow(lines[end])) end++;
  const raw = lines.slice(i, end).join("\n");
  if (end - i - 2 > MAX_TABLE_ROWS) return [raw, end];
  const rows = lines
    .slice(i + 2, end)
    .map((row) => splitRow(row).slice(0, head.length));
  const cells = rows.reduce((sum, row) => sum + row.length, head.length);
  if (cells > budget.left) return [raw, end];
  budget.left -= cells;
  const align = splitRow(lines[i + 1] ?? "").map(toAlign);
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
