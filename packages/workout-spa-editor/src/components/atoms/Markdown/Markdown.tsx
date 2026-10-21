import { useDeferredValue, useMemo } from "react";

import { MarkdownBlocks } from "./MarkdownBlocks";
import { MarkdownBoundary } from "./MarkdownBoundary";
import { parseMarkdown } from "./parse-markdown";

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
  return (
    <div
      className={`min-w-0 space-y-2 whitespace-pre-line break-words ${className}`}
    >
      <MarkdownBoundary source={source}>
        <MarkdownBody source={source} />
      </MarkdownBoundary>
    </div>
  );
}

/* While a reply streams every delta is a new source. Deferring it lets React
   skip re-parses it has no time for and keeps typing and scrolling responsive. */
function MarkdownBody({ source }: { source: string }) {
  const deferred = useDeferredValue(source);
  const blocks = useMemo(() => parseMarkdown(deferred), [deferred]);
  return <MarkdownBlocks blocks={blocks} />;
}
