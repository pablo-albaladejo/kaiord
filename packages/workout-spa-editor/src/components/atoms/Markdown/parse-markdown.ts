import { type Block, parseBlocks } from "./parse-blocks";

/** Markdown past this many characters is shown as plain text, unparsed. A
 * chat reply is a few KB; this only bounds what a runaway one can cost. */
export const MAX_MARKDOWN_CHARS = 100_000;

/** Entry point for rendering: parses up to the cap (cut at the last line
 * break before it, so no line is split) and keeps the rest as plain text. */
export function parseMarkdown(source: string): Block[] {
  if (source.length <= MAX_MARKDOWN_CHARS) return parseBlocks(source);
  const lineBreak = source.lastIndexOf("\n", MAX_MARKDOWN_CHARS);
  const cut = lineBreak > 0 ? lineBreak : MAX_MARKDOWN_CHARS;
  const rest: Block = { kind: "text", text: source.slice(cut).trim() };
  return [...parseBlocks(source.slice(0, cut)), rest];
}
