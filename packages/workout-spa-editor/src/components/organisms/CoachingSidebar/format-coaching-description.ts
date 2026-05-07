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
  // splitter below extracts those before this strip).
  return html.replace(/<\/?(?!strong\b)[^>]+>/gi, "").trim();
};

const decodeEntities = (s: string): string =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

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
  const paragraphs = paragraphMatches
    ? paragraphMatches.map((p) => p.replace(/^<p[^>]*>|<\/p>$/gi, ""))
    : raw.split(/\n{2,}/);
  return paragraphs
    .map((p) => ({ inlines: splitInlines(p) }))
    .filter((p) => p.inlines.length > 0);
};
