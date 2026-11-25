/**
 * What one cell of a Coaching Activity's steps grid holds, told by its class and its
 * icon (Train2Go marks nothing else): duration (clock), zone (no icon, bold),
 * power (bolt), heart rate (heart) or repeat count (repeat, left border).
 * Recovery rows use muted cells with their own icons. A cell that matches
 * none of these is `undefined`, so the whole grid is left unread.
 */
import { decodeEntities } from "./decode-entities";
import type { GridCell } from "./steps-grid-cells";

export type CellKind = "duration" | "zone" | "power" | "hr" | "repeat";
export type ReadCell = {
  kind: CellKind;
  recovery: boolean;
  text: string;
  span: number;
};

// Start of each icon's SVG path, work row first, then recovery row.
const ICONS: ReadonlyArray<readonly [string, CellKind]> = [
  ["M8 0C12.41", "duration"],
  ["M6.00488 1", "duration"],
  ["M12.2361 6", "power"],
  ["M10.3149 2", "power"],
  ["M1.15823 2", "hr"],
  ["M1.15825 2", "hr"],
  ["M13.0196 1", "repeat"],
];

const iconKind = (inner: string): CellKind | null | undefined => {
  const path = inner.match(/<path\b[^>]*\bd="([^"]*)"/)?.[1];
  if (path === undefined) return null;
  return ICONS.find(([start]) => path.startsWith(start))?.[1];
};

const textOf = (inner: string): string =>
  decodeEntities(
    inner.replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, "")
  )
    .replace(/\s+/g, " ")
    .trim();

const spanOf = (style: string): number => {
  const m = style.match(/grid-row:\s*span\s+(\d+)/);
  return m ? Number(m[1]) : 1;
};

export const readCell = (cell: GridCell): ReadCell | undefined => {
  const tokens = new Set(cell.className.split(/\s+/));
  if (!tokens.has("flex") || !tokens.has("items-center")) return undefined;
  const icon = iconKind(cell.inner);
  const bold = tokens.has("font-medium");
  const kind = icon === null ? (bold ? "zone" : undefined) : icon;
  if (!kind) return undefined;
  if ((kind === "repeat") !== tokens.has("border-l")) return undefined;
  return {
    kind,
    recovery: tokens.has("text-secondary-dark"),
    text: textOf(cell.inner),
    span: spanOf(cell.style),
  };
};
