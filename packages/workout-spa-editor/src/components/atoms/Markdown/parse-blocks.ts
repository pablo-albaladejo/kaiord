import { FENCE, readFence } from "./parse-fence";
import { LIST_ITEM, readList } from "./parse-list";
import { isTableStart, readTable, type TableData } from "./parse-table";

export type Block =
  | { kind: "paragraph" | "heading"; text: string }
  | { kind: "code"; text: string }
  | { kind: "rule" }
  | { kind: "quote"; blocks: Block[] }
  | { kind: "list"; ordered: boolean; start: number; items: Block[][] }
  | ({ kind: "table" } & TableData);

type Read = [Block, number];

const HEADING = /^ {0,3}#{1,6}\s+(.*?)\s*#*\s*$/;
const RULE = /^ {0,3}([-*_])(\s*\1){2,}\s*$/;
const QUOTE = /^ {0,3}>\s?(.*)$/;
const STARTERS = [FENCE, HEADING, RULE, QUOTE, LIST_ITEM];

/** Markdown → blocks. Line based and total: any input, however partial,
 * yields blocks and never throws. */
export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    if ((lines[i] ?? "").trim() === "") i++;
    else {
      const [block, next] = readBlock(lines, i);
      blocks.push(block);
      i = next;
    }
  }
  return blocks;
}

function readBlock(lines: string[], i: number): Read {
  const line = lines[i] ?? "";
  if (FENCE.test(line)) {
    const [text, next] = readFence(lines, i);
    return [{ kind: "code", text }, next];
  }
  const heading = HEADING.exec(line);
  if (heading) return [{ kind: "heading", text: heading[1] ?? "" }, i + 1];
  if (RULE.test(line)) return [{ kind: "rule" }, i + 1];
  if (QUOTE.test(line)) return readQuote(lines, i);
  if (LIST_ITEM.test(line)) {
    const [list, next] = readList(lines, i);
    return [
      { kind: "list", ...list, items: list.items.map(parseBlocks) },
      next,
    ];
  }
  if (isTableStart(lines, i)) {
    const [table, next] = readTable(lines, i);
    return [{ kind: "table", ...table }, next];
  }
  return readParagraph(lines, i);
}

function readQuote(lines: string[], i: number): Read {
  const body: string[] = [];
  let j = i;
  for (let m = QUOTE.exec(lines[j] ?? ""); m; m = QUOTE.exec(lines[j] ?? "")) {
    body.push(m[1] ?? "");
    j++;
  }
  return [{ kind: "quote", blocks: parseBlocks(body.join("\n")) }, j];
}

function readParagraph(lines: string[], i: number): Read {
  let j = i + 1;
  for (let line = lines[j]; line?.trim(); line = lines[++j])
    if (STARTERS.some((re) => re.test(line)) || isTableStart(lines, j)) break;
  const text = lines
    .slice(i, j)
    .map((l) => l.trim())
    .join("\n");
  return [{ kind: "paragraph", text }, j];
}
