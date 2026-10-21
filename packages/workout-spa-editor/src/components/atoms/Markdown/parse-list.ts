export const LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;

export type RawList = { ordered: boolean; start: number; items: string[] };

const isOrdered = (marker: string) => /\d/.test(marker);

/** Reads a list from its first item. A line indented past the marker belongs
 * to the current item (with that indent removed), so a nested list comes back
 * as markdown inside the item for the block parser to read again. */
export function readList(lines: string[], i: number): [RawList, number] {
  const [, lead = "", marker = "-", text = ""] =
    LIST_ITEM.exec(lines[i] ?? "") ?? [];
  const base = lead.length;
  const ordered = isOrdered(marker);
  const indent = new RegExp(`^ {0,${base + marker.length + 1}}`);
  const items: string[][] = [[text]];
  let j = i + 1;
  for (let line = lines[j]; line !== undefined; line = lines[++j]) {
    const item = LIST_ITEM.exec(line);
    const current = items[items.length - 1] ?? [];
    if (item && (item[1] ?? "").length <= base + 1) {
      if (isOrdered(item[2] ?? "") !== ordered) break;
      items.push([item[3] ?? ""]);
    } else if (line.trim() !== "" && /^\s/.test(line))
      current.push(line.replace(indent, ""));
    else if (line.trim() === "" && continuesAfterBlank(lines[j + 1], base))
      current.push("");
    else break;
  }
  const start = ordered ? Number.parseInt(marker, 10) : 1;
  return [{ ordered, start, items: items.map((l) => l.join("\n")) }, j];
}

function continuesAfterBlank(next: string | undefined, base: number): boolean {
  if (next === undefined) return false;
  return LIST_ITEM.test(next) || new RegExp(`^ {${base + 2},}\\S`).test(next);
}
