import { useMemo } from "react";

import { MarkdownBlocks } from "./MarkdownBlocks";
import { parseBlocks } from "./parse-blocks";

export type MarkdownProps = {
  /** Markdown written by the assistant; may be partial while it streams. */
  source: string;
  className?: string;
};

/** Safe markdown for model output: paragraphs, headings as bold lines, bold and
 * italic, inline and fenced code, lists, quotes, rules, GFM tables that scroll
 * in their own box, and http(s) links that open in a new tab. There is no raw
 * HTML path: every node is a React element and every string a text child. */
export function Markdown({ source, className = "" }: MarkdownProps) {
  const blocks = useMemo(() => parseBlocks(source), [source]);
  return (
    <div
      className={`min-w-0 space-y-2 whitespace-pre-line break-words ${className}`}
    >
      <MarkdownBlocks blocks={blocks} />
    </div>
  );
}
