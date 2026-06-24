import type { ReactNode } from "react";

import type { HighlightRange } from "../../../application/chat/build-snippet";

export type SnippetTextProps = {
  text: string;
  ranges: HighlightRange[];
};

/** Renders a snippet with its matched ranges wrapped in a static yellow mark.
 * Ranges are snippet-local, sorted, and non-overlapping. */
export function SnippetText({ text, ranges }: SnippetTextProps) {
  const segments: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], index) => {
    if (start > cursor) segments.push(text.slice(cursor, start));
    segments.push(
      <mark key={index} className="rounded bg-yellow-300 px-0.5 text-black">
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) segments.push(text.slice(cursor));
  return <>{segments}</>;
}
