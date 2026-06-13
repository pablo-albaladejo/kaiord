/**
 * Minimal formatter for coaching descriptions: preserves paragraph
 * breaks, bold emphasis, and safe links, stripping every other tag.
 * Returns a structured AST so the renderer can map to React without
 * `dangerouslySetInnerHTML`. The inline tokenizer lives in
 * `format-coaching-inlines.ts`.
 *
 * Bold input shapes (both supported):
 *   - HTML  `<strong>X</strong>` — what Train2Go ships natively.
 *   - Markdown `**X**` — what the train2go-bridge stores after its
 *     HTML→text conversion (`<strong>` → `**`).
 *
 * Link input shapes (both supported):
 *   - Markdown `[label](url)` — what the train2go-bridge stores after
 *     converting `<a href>` anchors.
 *   - Bare `https://…` URLs in plain text (coach-pasted, or data stored
 *     before linkification existed).
 *
 * Links are emitted ONLY for `https:` URLs (defense in depth: a
 * `javascript:`/`data:`/`http:` URL degrades to plain text and never
 * becomes an anchor), so the renderer can trust every `link` inline.
 * Out of scope: full HTML, lists.
 */

import {
  type DescriptionParagraph,
  splitInlines,
} from "./format-coaching-inlines";

export type {
  DescriptionInline,
  DescriptionParagraph,
} from "./format-coaching-inlines";

export const formatCoachingDescription = (
  raw: string
): DescriptionParagraph[] => {
  const paragraphMatches = raw.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  // For plain text input we split on any run of newlines: the
  // train2go-bridge parser flattens both `<p>` and `<br>` to single
  // `\n` (see packages/train2go-bridge/parser.js), so splitting only
  // on `\n{2,}` previously left the entire description as one paragraph.
  // Empty paragraphs are dropped by the `inlines.length > 0` filter
  // below, so this also tolerates `\n\n` AI/markdown shapes.
  const paragraphs = paragraphMatches
    ? paragraphMatches.map((p) => p.replace(/^<p[^>]*>|<\/p>$/gi, ""))
    : raw.split(/\n+/);
  return paragraphs
    .map((p) => ({ inlines: splitInlines(p) }))
    .filter((p) => p.inlines.length > 0);
};
