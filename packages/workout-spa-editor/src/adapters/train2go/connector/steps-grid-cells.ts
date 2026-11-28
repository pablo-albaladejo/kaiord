/**
 * The direct children of a Coaching Activity's steps grid (`<div class="grid">`), in
 * document order, read without a DOM like the other Train2Go parsers. The
 * grid has no data attributes: each child is a cell, five per row.
 * `undefined` when there is no grid, or it never closes.
 */
export type GridCell = { className: string; style: string; inner: string };

const GRID_OPEN = /<div\b[^>]*\bclass="grid"[^>]*>/;
const DIV_TAG = /<div\b[^>]*>|<\/div\s*>/g;

const attr = (tag: string, name: string): string =>
  tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? "";

const toCell = (openTag: string, inner: string): GridCell => ({
  className: attr(openTag, "class"),
  style: attr(openTag, "style"),
  inner,
});

export const readGridCells = (html: string): GridCell[] | undefined => {
  const open = GRID_OPEN.exec(html);
  if (!open) return undefined;
  const body = html.slice(open.index + open[0].length);
  const cells: GridCell[] = [];
  let depth = 0;
  let child: { tag: string; from: number } | null = null;
  for (const tag of body.matchAll(DIV_TAG)) {
    const at = tag.index ?? 0;
    if (!tag[0].startsWith("</")) {
      if (depth === 0) child = { tag: tag[0], from: at + tag[0].length };
      depth += 1;
      continue;
    }
    if (depth === 0) return cells;
    depth -= 1;
    if (depth === 0 && child) {
      cells.push(toCell(child.tag, body.slice(child.from, at)));
      child = null;
    }
  }
  return undefined;
};
