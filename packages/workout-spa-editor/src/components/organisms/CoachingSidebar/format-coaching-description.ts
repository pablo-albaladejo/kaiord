/**
 * Minimal formatter for coaching descriptions: preserves paragraph
 * breaks and bold emphasis, strips every other tag (per design D4 /
 * spec §9.3). Returns a structured AST so the renderer can map to
 * React without using `dangerouslySetInnerHTML`.
 *
 * Bold input shapes (both supported):
 *   - HTML  `<strong>X</strong>` — what Train2Go ships natively.
 *   - Markdown `**X**` — what the train2go-bridge currently stores
 *     after its HTML→text conversion (`<strong>` → `**`).
 *
 * Out of scope: full HTML, links, lists, line breaks via `<br>`.
 */

export type DescriptionInline =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string };

export type DescriptionParagraph = {
  inlines: DescriptionInline[];
};

const STRONG_RE =
  /<strong\b[^>]*>([\s\S]*?)<\/strong>|\*\*([^*\n][^*]*?)\*\*/gi;

const stripTagsExceptStrong = (html: string): string => {
  // Remove every tag except <strong>...</strong> markers (the strong
  // splitter below extracts those before this strip). Looped until
  // stable: a single pass can re-form a tag from interleaved input
  // (e.g. `<scr<b>ipt` -> `<script`).
  let text = html;
  let prev: string;
  do {
    prev = text;
    text = text.replace(/<\/?(?!strong\b)[^>]+>/gi, "");
  } while (text !== prev);
  return text.trim();
};

const ENTITY_REPLACEMENTS: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

// Single-pass decode: sequential .replace() chains double-decode
// payloads like `&amp;lt;` (first pass yields `&lt;`, second `<`).
const decodeEntities = (s: string): string =>
  s.replace(
    /&(?:amp|lt|gt|quot|#39|nbsp);/g,
    (entity) => ENTITY_REPLACEMENTS[entity] ?? entity
  );

const splitInlines = (paragraph: string): DescriptionInline[] => {
  const inlines: DescriptionInline[] = [];
  let lastIndex = 0;
  for (const match of paragraph.matchAll(STRONG_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      const text = decodeEntities(
        stripTagsExceptStrong(paragraph.slice(lastIndex, start))
      );
      if (text) inlines.push({ kind: "text", value: text });
    }
    // Two capture groups: HTML `<strong>...</strong>` (group 1) OR
    // markdown `**...**` (group 2). Whichever matched is the bold body.
    const inner = decodeEntities(
      stripTagsExceptStrong(match[1] ?? match[2] ?? "")
    );
    if (inner) inlines.push({ kind: "strong", value: inner });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < paragraph.length) {
    const tail = decodeEntities(
      stripTagsExceptStrong(paragraph.slice(lastIndex))
    );
    if (tail) inlines.push({ kind: "text", value: tail });
  }
  return inlines;
};

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
