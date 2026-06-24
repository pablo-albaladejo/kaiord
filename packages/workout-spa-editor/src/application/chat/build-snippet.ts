/**
 * Snippet windowing for chat search results.
 *
 * `findMatchRanges` locates the first occurrence of each token in the ORIGINAL
 * text (offsets stay aligned to the accented source via `normalizeWithMap`).
 * `buildSnippet` anchors a window on the earliest match, includes up to
 * `SNIPPET_CONTEXT_RADIUS` characters of context on each side, marks each
 * truncated side with an ellipsis, and rebases the highlight ranges that fall
 * inside the window to snippet-local coordinates.
 */
import { normalizeWithMap } from "./normalize-search-text";

export const SNIPPET_CONTEXT_RADIUS = 30;

const ELLIPSIS = "…";

export type HighlightRange = [start: number, end: number];

export type Snippet = {
  text: string;
  ranges: HighlightRange[];
};

/** First-occurrence original-text span for each token, sorted by start. */
export const findMatchRanges = (
  text: string,
  tokens: string[]
): HighlightRange[] => {
  const { normalized, map } = normalizeWithMap(text);
  const ranges: HighlightRange[] = [];
  for (const token of tokens) {
    const at = normalized.indexOf(token);
    const start = at === -1 ? undefined : map[at];
    if (start === undefined) continue;
    const end = at + token.length;
    ranges.push([
      start,
      end < map.length ? (map[end] ?? text.length) : text.length,
    ]);
  }
  return ranges.sort((a, b) => a[0] - b[0]);
};

/** Window the original text around its earliest match. */
export const buildSnippet = (
  text: string,
  ranges: HighlightRange[]
): Snippet => {
  const anchor = ranges[0];
  if (!anchor) return { text: "", ranges: [] };
  const [anchorStart, anchorEnd] = anchor;
  const windowStart = Math.max(0, anchorStart - SNIPPET_CONTEXT_RADIUS);
  const windowEnd = Math.min(text.length, anchorEnd + SNIPPET_CONTEXT_RADIUS);
  const prefix = windowStart > 0 ? ELLIPSIS : "";
  const suffix = windowEnd < text.length ? ELLIPSIS : "";
  const offset = prefix.length - windowStart;
  const rebased = ranges
    .filter(([start, end]) => start >= windowStart && end <= windowEnd)
    .map(([start, end]): HighlightRange => [start + offset, end + offset]);
  return {
    text: `${prefix}${text.slice(windowStart, windowEnd)}${suffix}`,
    ranges: rebased,
  };
};
