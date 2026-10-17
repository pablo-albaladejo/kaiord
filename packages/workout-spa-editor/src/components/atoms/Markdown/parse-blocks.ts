import {
  HEADING,
  headingText,
  isRule,
  QUOTE,
  readParagraphText,
  readQuoteBody,
} from "./block-starts";
import { FENCE, readFence } from "./parse-fence";
import { LIST_ITEM, readList } from "./parse-list";
import {
  type CellBudget,
  isTableStart,
  newCellBudget,
  readTable,
  type TableData,
} from "./parse-table";

export type Block =
  | { kind: "paragraph" | "heading" | "text"; text: string }
  | { kind: "code"; text: string }
  | { kind: "rule" }
  | { kind: "quote"; blocks: Block[] }
  | { kind: "list"; ordered: boolean; start: number; items: Block[][] }
  | ({ kind: "table" } & TableData);

type Read = [Block, number];

/** Per-message parse state: how deep quotes and lists have nested, and the
 * table cells all of the message's tables still share. */
type ParseContext = { depth: number; budget: CellBudget };

/** Quotes and lists nest by re-parsing their body. Past this depth the rest
 * is one plain paragraph, so `>>>>…` or `- - - …` ×3000 can neither overflow
 * the stack while parsing nor build a tree too deep to render. */
export const MAX_BLOCK_DEPTH = 12;

/** Markdown → blocks. Line based and total: any input, however partial or
 * hostile, yields blocks in linear time per level and never throws. */
export function parseBlocks(
  source: string,
  ctx: ParseContext = { depth: 0, budget: newCellBudget() }
): Block[] {
  if (ctx.depth >= MAX_BLOCK_DEPTH)
    return source.trim() === "" ? [] : [{ kind: "paragraph", text: source }];
  /* U+2028/U+2029 end a line for `.` and `$` but not for split("\n"): left
     in, a line never matches `(.*)$` and every pattern backtracks on it. */
  const lines = source.replace(/\r\n?|[\u2028\u2029]/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    if ((lines[i] ?? "").trim() === "") i++;
    else {
      const [block, next] = readBlock(lines, i, ctx);
      blocks.push(block);
      i = next;
    }
  }
  return blocks;
}

function readBlock(lines: string[], i: number, ctx: ParseContext): Read {
  const line = lines[i] ?? "";
  const nested = { ...ctx, depth: ctx.depth + 1 };
  if (FENCE.test(line)) {
    const [text, next] = readFence(lines, i);
    return [{ kind: "code", text }, next];
  }
  const heading = HEADING.exec(line);
  if (heading)
    return [{ kind: "heading", text: headingText(heading[1] ?? "") }, i + 1];
  if (isRule(line)) return [{ kind: "rule" }, i + 1];
  if (QUOTE.test(line)) {
    const [body, next] = readQuoteBody(lines, i);
    return [{ kind: "quote", blocks: parseBlocks(body, nested) }, next];
  }
  if (LIST_ITEM.test(line)) {
    const [list, next] = readList(lines, i);
    const items = list.items.map((item) => parseBlocks(item, nested));
    return [{ kind: "list", ...list, items }, next];
  }
  if (isTableStart(lines, i)) {
    const [table, next] = readTable(lines, i, ctx.budget);
    if (typeof table === "string") return [{ kind: "code", text: table }, next];
    return [{ kind: "table", ...table }, next];
  }
  const [text, next] = readParagraphText(lines, i);
  return [{ kind: "paragraph", text }, next];
}
