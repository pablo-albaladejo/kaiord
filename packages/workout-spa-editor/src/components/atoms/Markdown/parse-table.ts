export type Align = "left" | "center" | "right" | null;

export type TableData = { align: Align[]; head: string[]; rows: string[][] };

const DELIMITER_CELL = /^:?-+:?$/;

/** A GFM table starts on a row with a pipe followed by a `---|---` row. While
 * the delimiter row is still streaming the header stays a paragraph. */
export function isTableStart(lines: string[], i: number): boolean {
  const next = lines[i + 1];
  return (
    (lines[i] ?? "").includes("|") && next !== undefined && isDelimiterRow(next)
  );
}

/* Checked cell by cell in code: one regex for the whole row needs adjacent
   `\s*` runs, which backtrack quadratically on a line of spaces. */
function isDelimiterRow(line: string): boolean {
  if (!line.includes("|") || !line.includes("-")) return false;
  return splitRow(line).every((cell) => DELIMITER_CELL.test(cell));
}

export function readTable(lines: string[], i: number): [TableData, number] {
  const head = splitRow(lines[i] ?? "");
  const align = splitRow(lines[i + 1] ?? "").map(toAlign);
  const rows: string[][] = [];
  let j = i + 2;
  for (let row = lines[j]; isRow(row); row = lines[++j])
    rows.push(fit(splitRow(row), head.length, ""));
  return [{ align: fit(align, head.length, null), head, rows }, j];
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
