import {
  HEADING,
  headingText,
  isRule,
  QUOTE,
  startsBlock,
} from "./block-starts";
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

/** Quotes and lists nest by re-parsing their body. Past this depth the rest
 * is one plain paragraph, so `>>>>…` or `- - - …` ×3000 can neither overflow
 * the stack while parsing nor build a tree too deep to render. */
export const MAX_BLOCK_DEPTH = 12;

/** Markdown → blocks. Line based and total: any input, however partial or
 * hostile, yields blocks in linear time per level and never throws. */
export function parseBlocks(source: string, depth = 0): Block[] {
  if (depth >= MAX_BLOCK_DEPTH)
    return source.trim() === "" ? [] : [{ kind: "paragraph", text: source }];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    if ((lines[i] ?? "").trim() === "") i++;
    else {
      const [block, next] = readBlock(lines, i, depth);
      blocks.push(block);
      i = next;
    }
  }
  return blocks;
}

function readBlock(lines: string[], i: number, depth: number): Read {
  const line = lines[i] ?? "";
  if (FENCE.test(line)) {
    const [text, next] = readFence(lines, i);
    return [{ kind: "code", text }, next];
  }
  const heading = HEADING.exec(line);
  if (heading)
    return [{ kind: "heading", text: headingText(heading[1] ?? "") }, i + 1];
  if (isRule(line)) return [{ kind: "rule" }, i + 1];
  if (QUOTE.test(line)) return readQuote(lines, i, depth);
  if (LIST_ITEM.test(line)) {
    const [list, next] = readList(lines, i);
    const items = list.items.map((item) => parseBlocks(item, depth + 1));
    return [{ kind: "list", ...list, items }, next];
  }
  if (isTableStart(lines, i)) {
    const [table, next] = readTable(lines, i);
    return [{ kind: "table", ...table }, next];
  }
  return readParagraph(lines, i);
}

function readQuote(lines: string[], i: number, depth: number): Read {
  const body: string[] = [];
  let j = i;
  for (let m = QUOTE.exec(lines[j] ?? ""); m; m = QUOTE.exec(lines[j] ?? "")) {
    body.push(m[1] ?? "");
    j++;
  }
  const blocks = parseBlocks(body.join("\n"), depth + 1);
  return [{ kind: "quote", blocks }, j];
}

function readParagraph(lines: string[], i: number): Read {
  let j = i + 1;
  while ((lines[j] ?? "").trim() !== "" && !startsBlock(lines, j)) j++;
  const text = lines
    .slice(i, j)
    .map((l) => l.trim())
    .join("\n");
  return [{ kind: "paragraph", text }, j];
}
